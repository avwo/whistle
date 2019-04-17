var socks = require('socksv5');
var url = require('url');
var net = require('net');
var extend = require('extend');
var EventEmitter = require('events').EventEmitter;
var hparser = require('hparser');
var dispatch = require('./https');
var util = require('./util');
var rules = require('./rules');
var socketMgr = require('./socket-mgr');
var rulesUtil = require('./rules/util');
var existsCustomCert = require('./https/ca').existsCustomCert;
var pluginMgr = require('./plugins');
var config = require('./config');

var LOCALHOST = '127.0.0.1';
var TUNNEL_HOST_RE = /^[^:\/]+\.[^:\/]+:\d+$/;
var SOCKS_PROXY_RE = /^x?socks:\/\//;
var HTTPS_PROXY_RE = /^x?https-proxy:\/\//;
var X_RE = /^x/;
var STATUS_CODES = require('http').STATUS_CODES || {};
var getRawHeaderNames = hparser.getRawHeaderNames;
var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;

function tunnelProxy(server, proxy) {
  server.on('connect', function(req, reqSocket) {//ws, wss, https proxy
    var tunnelUrl = req.fullUrl = util.setProtocol(TUNNEL_HOST_RE.test(req.url) ? req.url : req.headers.host, true);
    var options;
    var parseUrl = function (_url, port) {
      _url = _url || tunnelUrl;
      options = req.options = url.parse(_url);
      options.port = options.port || port || 443;
      return options;
    };
    parseUrl();
    reqSocket.on('error', util.noop);
    tunnelUrl = req.fullUrl = 'tunnel://' + options.host;
    proxy.emit('_request', tunnelUrl);
    var resSocket, responsed, reqEmitter, data, rulesMgr, originPort;
    var headers, inspect, reqData, resData, res, rollBackTunnel, buf;
    req.isTunnel = true;
    req.method = util.toUpperCase(req.method) || 'CONNECT';
    reqSocket.clientIp = req.clientIp = util.getClientIp(req);
    req.reqId = reqSocket.reqId = util.getReqId();
    var hostname = options.hostname;
    var isICloundCKDB = hostname === 'p22-ckdatabase.icloud.com';
    var isIPHost = !isICloundCKDB && net.isIP(hostname);
    var policy = req.headers[config.WHISTLE_POLICY_HEADER];
    var useTunnelPolicy = policy == 'tunnel';
    var isLocalUIUrl = !useTunnelPolicy && config.isLocalUIUrl(hostname);
    if (isLocalUIUrl ? net.isIP(hostname) : util.isLocalAddress(hostname)) {
      isLocalUIUrl = options.port == config.port || options.port == config.uiport;
    }
    var _rules = req.rules = (isICloundCKDB || isLocalUIUrl) ? {} : rules.initRules(req);
    rules.resolveRulesFile(req, function() {
      var filter = req.filter;
      var disable = req.disable;
      var isDisabeIntercept = function() {
        return isICloundCKDB || useTunnelPolicy || disable.intercept || disable.https || disable.capture;
      };
      var isCustomIntercept = function() {
        return filter.https || filter.capture || filter.intercept || policy === 'intercept';
      };
      var isWebPort = options.port == 80 || options.port == 443 || isCustomIntercept();
      var isEnableIntercept = function() {
        if (isCustomIntercept()) {
          return true;
        }
        if (config.multiEnv || !rulesUtil.properties.get('interceptHttpsConnects')) {
          return existsCustomCert(hostname);
        }
        return true;
      };
      var isIntercept = function() {
        return isLocalUIUrl || (!isDisabeIntercept() && isEnableIntercept());
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
        if (req.headers[config.WEBUI_HEAD]) {
          delete req.headers[config.WEBUI_HEAD];
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
          dispatch(reqSocket, hostname, function(chunk) {
            if (isLocalUIUrl || (isIPHost && util.isLocalAddress(hostname)
              && options.port == config.port)) {
              return reqSocket.destroy();
            }
            buf = chunk;
            reqSocket.pause();
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
          inspect = util.isInspect(enable) || util.iscustomParser(req);
          headers = req.headers;
          req.clientPort = reqSocket.remotePort;
          reqData = {
            ip: req.clientIp,
            port: req.clientPort,
            method: req.method,
            httpVersion: req.httpVersion || '1.1',
            headers: headers,
            rawHeaderNames: reqRawHeaderNames
          };
          resData = {headers: {}};
          pluginMgr.postStats(req);
          reqEmitter = new EventEmitter();
          data = reqEmitter.data = {
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
          if (!filter.hide) {
            data.abort = emitError;
            proxy.emit('request', reqEmitter);
          }

          if (enable.abort || filter.abort || disable.tunnel) {
            return reqSocket.destroy();
          }

          var statusCode = util.getMatcherValue(_rules.statusCode);
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
              req.headers[config.PLUGIN_HOOK_NAME_HEADER] = config.PLUGIN_HOOKS.TUNNEL;
              socketMgr.setPending(req);
            }

            var realUrl = _rules.rule && _rules.rule.url.replace('https:', 'tunnel:');
            if (/^tunnel:\/\//.test(realUrl) && realUrl != tunnelUrl) {
              tunnelUrl = realUrl;
              data.realUrl = realUrl.replace('tunnel://', '');
              parseUrl();
            }
            originPort = options.port;
            rules.getProxy(tunnelUrl, proxyUrl ? null : req, function(err, hostIp, hostPort) {
              if (!proxyUrl) {
                proxyUrl = _rules.proxy ? util.rule.getMatcher(_rules.proxy) : null;
              }
              var isXProxy;
              if (proxyUrl) {
                isXProxy = X_RE.test(proxyUrl);
                var isSocks = SOCKS_PROXY_RE.test(proxyUrl);
                var isHttpsProxy = !isSocks && HTTPS_PROXY_RE.test(proxyUrl);
                var _url = 'http:' + util.removeProtocol(proxyUrl);
                data.proxy = true;
                getServerIp(_url, function(ip) {
                  options = parseUrl(_url, isSocks ? 1080 : (isHttpsProxy ? 443 : 80));
                  var isProxyPort = options.port == config.port;
                  if (isProxyPort && util.isLocalAddress(ip)) {
                    return emitError(new Error('Unable to proxy to itself'));
                  }
                  var handleProxy = function(proxySocket, _res) {
                    resSocket = proxySocket;
                    res = _res;
                    handleConnect();
                    abortIfUnavailable(resSocket);
                  };
                  var dstOptions = url.parse(tunnelUrl);
                  dstOptions.proxyHost = ip;
                  dstOptions.proxyPort = parseInt(options.port, 10);
                  resData.port = dstOptions.port = dstOptions.port || 443;
                  dstOptions.host = dstOptions.hostname;
                  util.parseRuleJson(_rules.reqHeaders, function(reqHeaders) {
                    var customXFF;
                    if (reqHeaders) {
                      reqHeaders = util.lowerCaseify(reqHeaders, reqRawHeaderNames);
                      customXFF = reqHeaders['x-forwarded-for'];
                      extend(headers, reqHeaders);
                    }
                    
                    if (disable.clientIp || disable.clientIP) {
                      delete headers[config.CLIENT_IP_HEAD];
                    } else {
                      var forwardedFor = util.getMatcherValue(_rules.forwardedFor);
                      if (forwardedFor) {
                        headers[config.CLIENT_IP_HEAD] = forwardedFor;
                      } else if (!customXFF && !config.keepXFF  && util.isLocalAddress(headers[config.CLIENT_IP_HEAD])) {
                        delete headers[config.CLIENT_IP_HEAD];
                      } else if (req.clientIp) {
                        headers[config.CLIENT_IP_HEAD] = req.clientIp;
                      }
                    }
                    var delReqHeaders = util.parseDeleteProperties(req).reqHeaders;
                    Object.keys(delReqHeaders).forEach(function(name) {
                      delete headers[name];
                    });
                    util.setClientId(headers, req.enable, req.disable, req.clientIp);
                    var _headers = extend({}, headers);
                    _headers.host = dstOptions.hostname + ':' + (dstOptions.port || 443);
                    if (disable.proxyUA) {
                      delete _headers['user-agent'];
                    } else {
                      _headers['user-agent'] = config.PROXY_UA;
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
                      var s = netMgr.connect(dstOptions, handleProxy);
                      s.on('error', isXProxy ? tunnel  : emitError);
                    };
                    if (reqDelay > 0) {
                      setTimeout(connectProxy, reqDelay);
                    } else {
                      connectProxy();
                    }
                  });
                });
              } else {
                tunnel(hostIp, hostPort);
              }
            });
          });
        }
        var retryConnect;
        var retryXHost = 0;
        function tunnel(hostIp, hostPort) {
          if (typeof hostIp !== 'string') {
            hostIp = null;
          }
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
              resSocket.on('error', retryConnect);
            }
          }, hostIp, hostPort);
        }

        function handleConnect() {
          if (retryConnect) {
            resSocket.removeListener('error', retryConnect);
            abortIfUnavailable(resSocket);
            retryConnect = null;
          }
          reqSocket.headers = headers;
          reqSocket.fullUrl = tunnelUrl;
          reqSocket.inspectFrames = useTunnelPolicy || inspect;
          reqSocket.enable = req.enable;
          if (buf) {
            reqSocket.unshift(buf);
            buf = null;
          }
          reqSocket.filter = req.filter;
          socketMgr.handleConnect(reqSocket, resSocket);
          data.codec = reqSocket._codecRule;
          var resDelay = util.getMatcherValue(_rules.resDelay);
          if (resDelay > 0) {
            setTimeout(sendEstablished, resDelay);
          } else {
            sendEstablished();
          }
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
          socket.on('error', emitError).on('close', emitError);
        }

        function sendEstablished(code) {
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
              } else {
                extend(resHeaders, newResHeaders);
                var responseFor = util.getMatcherValue(reqRules.responseFor);
                if (responseFor) {
                  resHeaders['x-whistle-response-for'] = responseFor;
                }
                util.setResponseFor(reqRules, resHeaders, req.headers, req.hostIp);
                var delResHeaders = util.parseDeleteProperties(req).resHeaders;
                Object.keys(delResHeaders).forEach(function(name) {
                  delete resHeaders[name];
                });
                var message = code == 200 ? 'Connection Established' : (STATUS_CODES[code] || 'unknown');
                var statusLine = ['HTTP/1.1', code, message].join(' ');
                var rawHeaderNames = getRawHeaderNames(res.rawHeaders) || {};
                var rawData = [statusLine, getRawHeaders(formatHeaders(resHeaders, rawHeaderNames))].join('\r\n') + '\r\n\r\n';
                if (code && code != 200) {
                  reqSocket.end(rawData);
                } else {
                  reqSocket.write(rawData);
                }
              }
              if (reqEmitter) {
                responsed = true;
                data.responseTime = data.endTime = Date.now();
                resData.rawHeaderNames = rawHeaderNames;
                resData.statusCode = code || 200;
                resData.headers = resHeaders;
                reqEmitter.emit('response', data);
                reqEmitter.emit('end', data);
              }
            });
          });
          return reqSocket;
        }

        function emitError(err) {
          if (responsed) {
            return;
          }
          responsed = true;
          resSocket && resSocket.destroy();
          reqSocket.destroy();
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
