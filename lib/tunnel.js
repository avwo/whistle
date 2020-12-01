var socks = require('sockx');
var url = require('url');
var net = require('net');
var extend = require('extend');
var LRU = require('lru-cache');
var EventEmitter = require('events').EventEmitter;
var hparser = require('hparser');
var dispatch = require('./https');
var util = require('./util');
var rules = require('./rules');
var socketMgr = require('./socket-mgr');
var rulesUtil = require('./rules/util');
var ca = require('./https/ca');
var pluginMgr = require('./plugins');
var config = require('./config');

var hasCustomCerts = ca.hasCustomCerts;
var existsCustomCert = ca.existsCustomCert;
var IP_CACHE = new LRU({ max: 600 });
var LOCALHOST = '127.0.0.1';
var TUNNEL_HOST_RE = /^[^:\/]+\.[^:\/]+:\d+$/;
var X_RE = /^x/;
var STATUS_CODES = require('http').STATUS_CODES || {};
var getRawHeaderNames = hparser.getRawHeaderNames;
var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;

function tunnelProxy(server, proxy) {
  proxy.getTunnelIp = function(id) {
    return IP_CACHE.get(id);
  };
  server.on('connect', function(req, reqSocket) {//ws, wss, https proxy
    var headers = req.headers;
    var tunnelUrl = req.fullUrl = util.setProtocol(TUNNEL_HOST_RE.test(req.url) ? req.url : headers.host, true);
    var options;
    var parseUrl = function (_url, port) {
      _url = _url || tunnelUrl;
      options = req.options = url.parse(_url);
      options.port = options.port || port || 443;
      if (options.host && options.host.indexOf(':') === -1) {
        options.host += ':' + options.port;
      }
      return options;
    };
    parseUrl();
    reqSocket.on('error', util.noop);
    tunnelUrl = req.fullUrl = 'tunnel://' + options.host;
    proxy.emit('_request', tunnelUrl);
    var resSocket, responsed, reqEmitter, data, rulesMgr, originPort;
    var inspect, reqData, resData, res, rollBackTunnel, buf;
    req.isTunnel = true;
    req.method = util.toUpperCase(req.method) || 'CONNECT';
    var clientInfo = util.parseClientInfo(req);
    reqSocket.clientIp = req.clientIp = clientInfo[0] || util.getClientIp(req);
    reqSocket.clientPort = req.clientPort = clientInfo[1] || util.getClientPort(req);
    delete headers[config.CLIENT_PORT_HEAD];
    req.reqId = reqSocket.reqId = util.getReqId();
    reqSocket.headers = headers;
    req.isPluginReq = reqSocket.isPluginReq = util.checkPluginReqOnce(req, true);
    var hostname = options.hostname;
    var isICloundCKDB = hostname === 'p22-ckdatabase.icloud.com';
    var isIPHost = !isICloundCKDB && net.isIP(hostname);
    var policy = headers[config.WHISTLE_POLICY_HEADER];
    var useTunnelPolicy = policy == 'tunnel';
    var isLocalUIUrl = !useTunnelPolicy && config.isLocalUIUrl(hostname);
    if (isLocalUIUrl ? isIPHost : util.isLocalHost(hostname)) {
      isLocalUIUrl = options.port == config.port || options.port == config.uiport;
    }
    var _rules = req.rules = reqSocket.rules = (isICloundCKDB || isLocalUIUrl) ? {} : rules.initRules(req);
    rules.resolveRulesFile(req, function() {
      var filter = req.filter;
      var disable = req.disable;
      var isDisabeIntercept = function() {
        return isICloundCKDB || useTunnelPolicy || disable.intercept || disable.https || disable.capture || req.isPluginReq;
      };
      var isCustomIntercept = function() {
        return filter.https || filter.capture || filter.intercept || policy === 'intercept';
      };
      var isWebPort = options.port == 80 || options.port == 443 || isCustomIntercept();
      var isEnableIntercept = function() {
        if (isCustomIntercept()) {
          return true;
        }
        if (!rulesUtil.properties.isEnableCapture()) {
          return existsCustomCert(hostname);
        }
        return true;
      };
      var isIntercept = function() {
        if (isLocalUIUrl || (!isDisabeIntercept() && isEnableIntercept())) {
          return true;
        }
        if (!isIPHost || !hasCustomCerts()) {
          return false;
        }
        reqSocket.useProxifier = (config.proxifier2 || (config.proxifier && isWebPort)) && !disable.proxifier;
        return reqSocket.useProxifier;
      };
      var plugin = !isIntercept() && pluginMgr.resolveWhistlePlugins(req);
      var handlePluginRules = function(_rulesMgr) {
        if (_rulesMgr) {
          rulesMgr = _rulesMgr;
          req.curUrl = tunnelUrl;
          util.mergeRules(req, rulesMgr.resolveRules(req));
          plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
        }
        filter = req.filter;
        disable = req.disable;
        if (headers[config.WEBUI_HEAD]) {
          delete headers[config.WEBUI_HEAD];
          reqSocket.destroy();
          return false;
        }
        return true;
      };
      pluginMgr.getTunnelRules(req, function(_rulesMgr) {
        abortIfUnavailable(reqSocket);
        if (!handlePluginRules(_rulesMgr)) {
          return;
        }
        if (isIntercept()) {
          reqSocket.rulesHeaders = req.rulesHeaders;
          reqSocket.tunnelHost = options.host;
          reqSocket.enable = req.enable;
          reqSocket.disable = req.disable;
          reqSocket._curHostname = hostname;
          dispatch(reqSocket, function(chunk) {
            if (isLocalUIUrl || (isIPHost && util.isLocalAddress(hostname)
              && options.port == config.port)) {
              return reqSocket.destroy();
            }
            buf = chunk;
            rollBackTunnel = true;
            plugin = pluginMgr.resolveWhistlePlugins(req);
            pluginMgr.getTunnelRules(req, function(_rulesMgr2) {
              if (handlePluginRules(_rulesMgr2)) {
                handleTunnel();
              }
            });
          }, !req.enable.socket && isWebPort);
          util.setEstablished(reqSocket);
          return;
        }
        
        handleTunnel();
        
        function handleTunnel() {
          var reqRawHeaderNames = getRawHeaderNames(req.rawHeaders) || {};
          var enable = req.enable;
          inspect = util.isInspect(enable) || util.isCustomParser(req);
          reqData = {
            ip: req.clientIp,
            port: req.clientPort,
            method: req.method,
            httpVersion: req.httpVersion || '1.1',
            headers: headers,
            rawHeaderNames: reqRawHeaderNames
          };
          resData = {headers: {}};
          reqEmitter = new EventEmitter();
          data = {
            id: req.reqId,
            url: options.host,
            startTime: Date.now(),
            rules: _rules,
            req: reqData,
            res: resData,
            isHttps: true,
            inspect: inspect,
            rulesHeaders: req.rulesHeaders
          };
          if (!req.isPluginReq && !config.rulesMode && (!filter.hide || disable.hide)) {
            data.abort = emitError;
            proxy.emit('request', reqEmitter, data);
          }
          util.parseRuleJson(_rules.reqHeaders, function(reqHeaders) {
            var customXFF;
            if (reqHeaders) {
              reqHeaders = util.lowerCaseify(reqHeaders, reqRawHeaderNames);
              customXFF = reqHeaders[config.CLIENT_IP_HEAD];
              delete reqHeaders[config.CLIENT_IP_HEAD];
              extend(headers, reqHeaders);
            }
            
            if (disable.clientIp || disable.clientIP) {
              delete headers[config.CLIENT_IP_HEAD];
            } else {
              var forwardedFor = util.getMatcherValue(_rules.forwardedFor);
              if (net.isIP(forwardedFor)) {
                headers[config.CLIENT_IP_HEAD] = forwardedFor;
              } else if (net.isIP(customXFF)) {
                headers[config.CLIENT_IP_HEAD] = customXFF;
              } else if (util.isLocalAddress(req.clientIp)) {
                delete headers[config.CLIENT_IP_HEAD];
              } else {
                headers[config.CLIENT_IP_HEAD] = req.clientIp;
              }
            }
            var delReqHeaders = util.parseDeleteProperties(req).reqHeaders;
            Object.keys(delReqHeaders).forEach(function(name) {
              delete headers[name];
            });
            pluginMgr.postStats(req);
            if (enable.abort || filter.abort || disable.tunnel) {
              return reqSocket.destroy();
            }
  
            var statusCode = util.getStatusCodeFromRule(_rules);
            if (statusCode) {
              if (statusCode == 200) {
                resSocket = util.getEmptyRes();
                var reqDelay = util.getMatcherValue(_rules.reqDelay);
                data.requestTime = data.dnsTime = Date.now();
                if (reqDelay > 0) {
                  setTimeout(handleConnect, reqDelay);
                } else {
                  handleConnect();
                }
                return;
              }
              return sendEstablished(statusCode);
            }
  
            pluginMgr.loadPlugin(plugin, function(err, ports) {
              if (err) {
                return sendEstablished(500);
              }
              var tunnelPort = ports && (ports.tunnelPort || ports.port);
              var proxyUrl;
              if(tunnelPort) {
                proxyUrl = 'proxy://127.0.0.1:' + tunnelPort;
                reqSocket.customParser = req.customParser = util.getParserStatus(req);
                pluginMgr.addRuleHeaders(req, _rules);
                headers[config.PLUGIN_HOOK_NAME_HEADER] = config.PLUGIN_HOOKS.TUNNEL;
                socketMgr.setPending(req);
                data.reqPlugin = 1;
              }
  
              var realUrl = _rules.rule && _rules.rule.url;
              if (realUrl) {
                var isHttp;
                if (/^https?:/.test(realUrl)) {
                  isHttp = realUrl[4] === ':';
                  realUrl = 'tunnel' + realUrl.substring(realUrl.indexOf(':'));
                }
                if (/^tunnel:\/\//.test(realUrl) && realUrl != tunnelUrl) {
                  parseUrl(realUrl, isHttp ? 80 : 443);
                  tunnelUrl = 'tunnel://' + options.host;
                  data.realUrl = tunnelUrl.replace('tunnel://', '');
                }
              }
              originPort = options.port;
              if (_rules.ua) {
                var ua = util.getMatcherValue(_rules.ua);
                headers['user-agent'] = ua;
              }
              rules.getProxy(tunnelUrl, proxyUrl ? null : req, function(err, hostIp, hostPort) {
                var proxyRule = _rules.proxy || '';
                if (!proxyUrl) {
                  proxyUrl = proxyRule ? util.rule.getMatcher(proxyRule) : null;
                }
                var isXProxy;
                if (proxyUrl) {
                  isXProxy = X_RE.test(proxyUrl);
                  var isSocks = proxyRule.isSocks;
                  var isHttpsProxy =  proxyRule.isHttps;
                  var _url = 'http:' + util.removeProtocol(proxyUrl);
                  data.proxy = true;
                  getServerIp(_url, function(ip) {
                    options = parseUrl(_url, isSocks ? 1080 : (isHttpsProxy ? 443 : 80));
                    var isProxyPort = options.port == config.port;
                    if (isProxyPort && util.isLocalAddress(ip)) {
                      return emitError(new Error('Self loop (' + ip + ':' + config.port + ')'));
                    }
                    var handleProxy = function(proxySocket, _res) {
                      resSocket = proxySocket;
                      res = _res;
                      // 通知插件连接建立成功的回调
                      handleConnect();
                      abortIfUnavailable(resSocket);
                    };
                    var dstOptions = url.parse(tunnelUrl);
                    dstOptions.proxyHost = ip;
                    dstOptions.proxyPort = parseInt(options.port, 10);
                    dstOptions.port = dstOptions.port || 443;
                    resData.port = dstOptions.proxyPort;
                    dstOptions.host = dstOptions.hostname;
                    util.setClientId(headers, req.enable, req.disable, req.clientIp, proxyRule.isInternal);
                    var _headers = extend({}, headers);
                    _headers.host = dstOptions.hostname + ':' + (dstOptions.port || 443);
                    if (disable.proxyUA) {
                      delete _headers['user-agent'];
                    }
                    dstOptions.headers = formatHeaders(_headers, reqRawHeaderNames);
                    if (isSocks) {
                      dstOptions.proxyPort = options.port || 1080;
                      dstOptions.localDNS = false;
                      dstOptions.auths = config.getAuths(options);
                    } else {
                      dstOptions.proxyPort = options.port || 80;
                      dstOptions.proxyAuth = options.auth;
                      if (isProxyPort) {
                        _headers[config.WEBUI_HEAD] = 1;
                      }
                    }
                    var netMgr = isSocks ? socks : config;
                    var reqDelay = util.getMatcherValue(_rules.reqDelay);
                    util.setProxyHost(req, dstOptions, true);
                    if (isHttpsProxy) {
                      dstOptions.proxyServername = options.hostname;
                    }
                    var connectProxy = function() {
                      if (responsed) {
                        return;
                      }
                      if (req.isPluginReq) {
                        var host = ip + ':' + dstOptions.proxyPort;
                        if (req._phost && req._phost.host) {
                          IP_CACHE.set(req.isPluginReq, req._phost.host + ', ' + host);
                        } else {
                          IP_CACHE.set(req.isPluginReq, host);
                        }
                      } else if (req._phost) {
                        resData.phost = req._phost.host;
                      }
                      resData.port = dstOptions.port;
                      try {
                        if (!tunnelPort && req._proxyTunnel) {
                          dstOptions.proxyTunnelPath = util.removeProtocol(tunnelUrl, true);
                        }
                        var s = netMgr.connect(dstOptions, handleProxy);
                        s.on('error', function(err) {
                          if (isXProxy) {
                            resData.phost = undefined;
                            tunnel();
                          } else {
                            emitError(err);
                          }
                        });
                      } catch (e) {
                        emitError(e);
                      }
                    };
                    if (reqDelay > 0) {
                      setTimeout(connectProxy, reqDelay);
                    } else {
                      connectProxy();
                    }
                  });
                } else {
                  tunnel(hostIp, hostPort);
                }
              });
            });
          });
        }
        var retryConnect;
        var retryXHost = 0;
        function tunnel(hostIp, hostPort) {
          getServerIp(tunnelUrl, function(ip, port) {
            if (port) {
              req.hostIp = resData.ip = util.getHostIp(ip, port);
              resData.port = port;
            } else {
              req.hostIp = resData.ip = ip;
              // 不要赋值给port，否则重试时getServerIp会有端口
              resData.port = port || originPort;
            }
            if (responsed) {
              return;
            }
            if (req.isPluginReq) {
              IP_CACHE.set(req.isPluginReq, req.hostIp);
            }
            resSocket = net.connect(resData.port, ip, handleConnect);
            if (retryConnect) {
              abortIfUnavailable(resSocket);
            } else {
              retryConnect = function() {
                if (retryXHost < 2 && _rules.host && X_RE.test(_rules.host.matcher)) {
                  ++retryXHost;
                  retryConnect = false;
                  if (retryXHost > 1) {
                    req.curUrl = tunnelUrl;
                    rules.lookupHost(req, function(_err, _ip) {
                      if (_err) {
                        return emitError(_err);
                      }
                      tunnel(_ip, originPort);
                    });
                    return;
                  }
                }
                tunnel(ip, port);
              };
              var retried;
              resSocket.on('error', function() {
                if (!retried) {
                  retried = true;
                  this.destroy && this.destroy();
                  !responsed && retryConnect && retryConnect();
                }
              });
            }
          }, hostIp, hostPort);
        }

        function handleConnect() {
          if (retryConnect) {
            resSocket.removeListener('error', retryConnect);
            abortIfUnavailable(resSocket);
            retryConnect = null;
          }
          reqSocket.inspectFrames = useTunnelPolicy || inspect;
          reqSocket.fullUrl = tunnelUrl;
          reqSocket.enable = req.enable;
          reqSocket.disable = req.disable;
          reqSocket.filter = req.filter;
          reqSocket.hostIp = req.hostIp;
          reqSocket.method = req.method;
          reqSocket.headerRulesMgr = req.headerRulesMgr;
          reqSocket.clientPort = req.clientPort;
          reqSocket.globalValue = req.globalValue;
          resSocket.statusCode = resData.statusCode;
          if (buf) {
            var _pipe = reqSocket.pipe;
            reqSocket.pipe = function(stream) {
              if (buf) {
                stream.write(buf);
                buf = null;
              }
              return _pipe.apply(this, arguments);
            };
          }
          pluginMgr.resolvePipePlugin(reqSocket, function() {
            data.pipe = reqSocket._pipeRule;
            if (reqSocket._pipePluginPorts) {
              reqSocket.inspectFrames = data.inspect = true;
              reqSocket.customParser = false;
            }
            var handleEstablished = function() {
              if (useTunnelPolicy) {
                sendEstablished(200, function() {
                  setTimeout(function() {
                    socketMgr.handleConnect(reqSocket, resSocket);
                  }, 16);
                });
              } else {
                socketMgr.handleConnect(reqSocket, resSocket);
                sendEstablished();
              }
            };
            var resDelay = util.getMatcherValue(_rules.resDelay);
            if (resDelay > 0) {
              setTimeout(handleEstablished, resDelay);
            } else {
              handleEstablished();
            }
          });
        }

        function getServerIp(url, callback, hostIp, hostPort) {
          var hostHandler = function(err, ip, port, host) {
            if (host) {
              _rules.host = host;
            }
            data.requestTime = data.dnsTime = Date.now();
            req.hostIp = resData.ip = ip || LOCALHOST;
            reqEmitter.emit('send', data);
            err ? emitError(err) : callback(ip, port);
          };
          if (hostIp) {
            hostHandler(null, hostIp, hostPort);
          } else {
            req.curUrl = url;
            rules.resolveHost(req, hostHandler, rulesMgr, req.rulesFileMgr, req.headerRulesMgr);
          }
        }

        function abortIfUnavailable(socket) {
          util.onSocketEnd(socket, emitError);
        }

        function sendEstablished(code, cb) {
          if (res) {
            code = res.statusCode;
            if (!res.headers['proxy-agent']) {
              res.headers['proxy-agent'] = config.name;
              res.rawHeaders = res.rawHeaders || [];
              res.rawHeaders.push('proxy-agent', 'Proxy-Agent');
            }
          } else {
            code = code || 200;
            res = {
              statusCode: code,
              headers: {
                'proxy-agent': config.name
              },
              rawHeaders: ['proxy-agent', 'Proxy-Agent']
            };
          }
          var resHeaders = res.headers;
          pluginMgr.getResRules(req, res, function() {
            var reqRules = req.rules;
            util.parseRuleJson(rollBackTunnel ? null : reqRules.resHeaders, function(newResHeaders) {
              if (rollBackTunnel) {
                reqSocket.resume();
                cb && cb();
              } else {
                var rawHeaderNames = getRawHeaderNames(res.rawHeaders) || {};
                if (newResHeaders) {
                  util.lowerCaseify(newResHeaders, rawHeaderNames);
                  extend(resHeaders, newResHeaders);
                }
                var responseFor = util.getMatcherValue(reqRules.responseFor);
                if (responseFor) {
                  resHeaders['x-whistle-response-for'] = responseFor;
                }
                util.setResponseFor(reqRules, resHeaders, req, req.hostIp);
                var delResHeaders = util.parseDeleteProperties(req).resHeaders;
                Object.keys(delResHeaders).forEach(function(name) {
                  delete resHeaders[name];
                });
                var message = code == 200 ? 'Connection Established' : (STATUS_CODES[code] || 'unknown');
                var statusLine = ['HTTP/1.1', code, message].join(' ');
                var rawData = [statusLine, getRawHeaders(formatHeaders(resHeaders, rawHeaderNames))].join('\r\n') + '\r\n\r\n';
                if (code && code != 200) {
                  reqSocket.end(rawData, cb);
                } else {
                  reqSocket.write(rawData, cb);
                }
              }
              if (reqEmitter) {
                responsed = true;
                data.responseTime = data.endTime = Date.now();
                resData.rawHeaderNames = rawHeaderNames;
                resData.statusCode = code || 200;
                resData.ip = resData.ip || LOCALHOST;
                resData.headers = resHeaders;
                reqEmitter.emit('response', data);
                reqEmitter.emit('end', data);
              }
              pluginMgr.postStats(req, res);
            });
          });
          return reqSocket;
        }
        var reqDestroyed, resDestroyed;
        function emitError(err) {
          if (!reqDestroyed && !responsed) {
            reqDestroyed = true;
            reqSocket.destroy();
          }
          if (resSocket && !resDestroyed) {
            resDestroyed = true;
            resSocket.destroy();
          }
          if (responsed) {
            return;
          }
          responsed = true;    
          if (!reqEmitter) {
            return;
          }
          data.responseTime = data.endTime = Date.now();

          if (!resData.ip) {
            req.hostIp = resData.ip = LOCALHOST;
          }

          if (!err && !resData.statusCode) {
            err = new Error('Aborted');
            data.reqError = true;
            resData.statusCode ='aborted';
            reqData.body = util.getErrorStack(err);
            reqEmitter.emit('abort', data);
          } else {
            data.resError = true;
            resData.statusCode = resData.statusCode || 502;
            resData.body = err ? util.getErrorStack(err) : 'Aborted';
            util.emitError(reqEmitter, data);
          }
          resData.headers = {'x-server':'whistle' };
          pluginMgr.postStats(req, resData);
        }
      });
    });
  });

  return server;
}

module.exports = tunnelProxy;
