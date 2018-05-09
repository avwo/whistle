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
var pluginMgr = require('./plugins');
var config = require('./config');

var LOCALHOST = '127.0.0.1';
var TUNNEL_HOST_RE = /^[^:\/]+\.[^:\/]+:\d+$/;
var STATUS_CODES = require('http').STATUS_CODES || {};
var getRawHeaderNames = hparser.getRawHeaderNames;
var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;

function tunnelProxy(server, proxy) {
  server.on('connect', function(req, reqSocket, head) {//ws, wss, https proxy
    var tunnelUrl = req.fullUrl = util.setProtocol(TUNNEL_HOST_RE.test(req.url) ? req.url : req.headers.host, true);
    var options;
    var parseUrl = function (_url, port) {
      _url = _url || tunnelUrl;
      options = req.options = url.parse(_url);
      options.port = options.port || port || 443;
      return options;
    };
    parseUrl();
    tunnelUrl = req.fullUrl = 'tunnel://' + options.host;
    proxy.emit('_request', tunnelUrl);
    var resSocket, responsed, reqEmitter, data, rulesMgr, res;
    req.isTunnel = true;
    reqSocket.clientIp = req.clientIp = util.getClientIp(req);
    req.reqId = reqSocket.reqId = util.getReqId();
    var hostname = options.hostname;
    var isICloundCKDB = hostname === 'p22-ckdatabase.icloud.com';
    var isIPHost = !isICloundCKDB && net.isIP(hostname);
    var policy = req.headers[config.WHISTLE_POLICY_HEADER];
    var useTunnelPolicy = policy == 'tunnel';
    var isLocalUIUrl = !useTunnelPolicy && (config.isLocalUIUrl(hostname) || config.isPluginUrl(hostname));
    var _rules = req.rules = (isICloundCKDB || isLocalUIUrl) ? {} : rules.initRules(req);
    rules.resolveRulesFile(req, function() {
      var filter = req.filter;
      var disable = req.disable;
      var isDisabeIntercept = function() {
        return isICloundCKDB || useTunnelPolicy || disable.intercept || disable.https || disable.capture;
      };
      var isEnableIntercept = function() {
        return policy === 'intercept' || (!isIPHost && rulesUtil.properties.get('interceptHttpsConnects'))
          || filter.https || filter.capture || filter.intercept;
      };
      var isIntercept = function() {
        return isLocalUIUrl || (!isDisabeIntercept() && isEnableIntercept());
      };
      var plugin = isIntercept() ? null : pluginMgr.resolveWhistlePlugins(req);
      pluginMgr.getTunnelRules(req, function(_rulesMgr) {
        if (_rulesMgr) {
          rulesMgr = _rulesMgr;
          util.mergeRules(req, rulesMgr.resolveRules(tunnelUrl));
          plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
        }
        filter = req.filter;
        disable = req.disable;
        abortIfUnavailable(reqSocket);
        if (req.headers[config.WEBUI_HEAD]) {
          delete req.headers[config.WEBUI_HEAD];
          return reqSocket.destroy();
        }
        if (isIntercept()) {
          dispatch(reqSocket, hostname, function(_resSocket) {
            resSocket = _resSocket;
          });
          sendEstablished();
          return;
        }
        pluginMgr.postStats(req);
        req.whistleTunnelPlugins = req.whistlePlugins;
        req.whistlePlugins = null;
        reqEmitter = new EventEmitter();
        req.clientPort = reqSocket.remotePort;
        var headers = req.headers;
        var reqRawHeaderNames = getRawHeaderNames(req.rawHeaders) || {};
        var reqData = {
          ip: req.clientIp,
          port: req.clientPort,
          method: util.toUpperCase(req.method) || 'CONNECT',
          httpVersion: req.httpVersion || '1.1',
          headers: headers,
          rawHeaderNames: reqRawHeaderNames
        };
        var resData = {headers: {}};
        data = reqEmitter.data = {
          id: req.reqId,
          url: options.host,
          startTime: Date.now(),
          rules: _rules,
          req: reqData,
          res: resData,
          isHttps: true,
          rulesHeaders: req.rulesHeaders
        };
        var cId = headers['x-whistle-composer-id'];
        if (cId) {
          data.cId = cId;
          delete headers['x-whistle-composer-id'];
        }
        if (!filter.hide) {
          proxy.emit('request', reqEmitter);
        }

        if (req.enable.abort || filter.abort || disable.tunnel) {
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

        pluginMgr.loadPlugin(plugin, function() {
          var tunnelPort, proxyUrl;
          if(plugin) {
            tunnelPort = plugin.ports && plugin.ports.tunnelPort;
            if (!tunnelPort) {
              return emitError(new Error('No plugin.tunnelServer'));
            }
            proxyUrl = 'proxy://127.0.0.1:' + tunnelPort;
            pluginMgr.addRuleHeaders(req, _rules);
          }

          var realUrl = _rules.rule && _rules.rule.url.replace('https:', 'tunnel:');
          if (/^tunnel:\/\//.test(realUrl) && realUrl != tunnelUrl) {
            tunnelUrl = realUrl;
            data.realUrl = realUrl.replace('tunnel://', '');
            parseUrl();
          }

          rules.getProxy(tunnelUrl, proxyUrl ? null : req, function(err, hostIp, hostPort) {
            if (!proxyUrl) {
              proxyUrl = _rules.proxy ? _rules.proxy.matcher : null;
            }

            if (proxyUrl) {
              var isSocks = /^socks:\/\//.test(proxyUrl);
              var _url = 'http:' + util.removeProtocol(proxyUrl);
              data.proxy = true;
              resolveHost(_url, function(ip) {
                options = parseUrl(_url, isSocks ? 1080 : 80);
                var isProxyPort = options.port == config.port;
                if (isProxyPort && util.isLocalAddress(ip)) {
                  return emitError(new Error('Unable to proxy to itself'));
                }
                var onConnect = function(proxySocket, _res) {
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
                var _headers = extend({}, headers);
                pluginMgr.addRuleHeaders(req, _rules, _headers);
                _headers.host = dstOptions.hostname + ':' + (dstOptions.port || 443);
                util.parseRuleJson(_rules.reqHeaders, function(reqHeaders) {
                  extend(headers, reqHeaders);
                  if (disable.clientIp || disable.clientIP
                    || util.isLocalAddress(headers[config.CLIENT_IP_HEAD])) {
                    delete headers[config.CLIENT_IP_HEAD];
                  } else {
                    var forwardedFor = util.getMatcherValue(_rules.forwardedFor);
                    if (forwardedFor) {
                      headers[config.CLIENT_IP_HEAD] = forwardedFor;
                    }
                  }
                  var delReqHeaders = util.parseDeleteProperties(req).reqHeaders;
                  Object.keys(delReqHeaders).forEach(function(name) {
                    delete headers[name];
                  });
                  dstOptions.headers = formatHeaders(headers, reqRawHeaderNames);
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
                  if (reqDelay > 0) {
                    setTimeout(function() {
                      netMgr.connect(dstOptions, onConnect).on('error', emitError);
                    }, reqDelay);
                  } else {
                    netMgr.connect(dstOptions, onConnect).on('error', emitError);
                  }
                });
              });
            } else {
              tunnel(hostIp, hostPort);
            }
          });
        });

        function tunnel(hostIp, hostPort) {
          resolveHost(tunnelUrl, function(ip, port) {
            if (port) {
              req.hostIp = resData.ip = ip + ':' + port;
              resData.port = port;
            } else {
              req.hostIp = resData.ip = ip;
              resData.port = port = options.port;
            }
            resSocket = net.connect(port, ip, handleConnect);
            abortIfUnavailable(resSocket);
          }, hostIp, hostPort);
        }

        function handleConnect() {
          reqSocket.headers = headers;
          reqSocket.fullUrl = tunnelUrl;
          reqSocket.useTunnelPolicy = useTunnelPolicy;
          socketMgr.handleConnect(reqSocket, resSocket);
          var resDelay = util.getMatcherValue(_rules.resDelay);
          if (resDelay > 0) {
            setTimeout(sendEstablished, resDelay);
          } else {
            sendEstablished();
          }
        }

        function resolveHost(url, callback, hostIp, hostPort) {
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
            rules.resolveHost(url, hostHandler, rulesMgr, req.rulesFileMgr, req.headerRulesMgr);
          }
        }

        function abortIfUnavailable(socket) {
          socket.on('error', emitError).on('close', emitError);
        }

        function sendEstablished(code) {
          if (res) {
            code = res.statusCode;
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
            util.parseRuleJson(reqRules.resHeaders, function(newResHeaders) {
              extend(resHeaders, newResHeaders);
              var responseFor = util.getMatcherValue(reqRules.responseFor);
              if (responseFor) {
                resHeaders['x-whistle-response-for'] = responseFor;
              }
              var delResHeaders = util.parseDeleteProperties(req).resHeaders;
              Object.keys(delResHeaders).forEach(function(name) {
                delete resHeaders[name];
              });
              if (!resHeaders['proxy-agent']) {
                resHeaders['proxy-agent'] = config.name;
                res.rawHeaders = res.rawHeaders || [];
                res.rawHeaders.push('proxy-agent', 'Proxy-Agent');
              }
              var message = code == 200 ? 'Connection Established' : (STATUS_CODES[code] || 'unknown');
              var statusLine = ['HTTP/1.1', code, message].join(' ');
              var rawHeaderNames = getRawHeaderNames(res.rawHeaders) || {};
              var rawData = [statusLine, getRawHeaders(formatHeaders(resHeaders, rawHeaderNames))].join('\r\n') + '\r\n\r\n';
              if (code && code != 200) {
                reqSocket.end(rawData);
              } else {
                reqSocket.write(rawData);
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

          if (!err) {
            err = new Error('Aborted');
            data.reqError = true;
            resData.statusCode ='aborted';
            reqData.body = util.getErrorStack(err);
            reqEmitter.emit('abort', data);
          } else {
            data.resError = true;
            resData.statusCode = resData.statusCode || 502;
            resData.body = util.getErrorStack(err);
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
