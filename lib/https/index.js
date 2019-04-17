var net = require('net');
var tls = require('tls');
var url = require('url');
var socks = require('socksv5');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var Buffer = require('safe-buffer').Buffer;
var LRU = require('lru-cache');
var checkSNI = require('sni');
var util = require('../util');
var extend = require('extend');
var config = require('../config');
var rules = require('../rules');
var pluginMgr = require('../plugins');
var socketMgr = require('../socket-mgr');
var hparser = require('hparser');
var ca = require('./ca');

var getRawHeaders = hparser.getRawHeaders;
var parseReq = hparser.parse;
var getDomain = ca.getDomain;
var serverAgent = ca.serverAgent;
var getSNIServer = ca.getSNIServer;
var LOCALHOST = '127.0.0.1';
var tunnelTmplData = new LRU({max: 3000, maxAge: 30000});
var TIMEOUT = 5000;
var LOCAL_TIMEOUT = 3000;
var AUTH_TIMEOUT = 3000;
var INTERNAL_PROXY_RE = /^x?internal-proxy:\/\//;
var HS2H_PROXY_RE = /^x?https2http-proxy:\/\//;
var H2HS_PROXY_RE = /^x?http2https-proxy:\/\//;
var SOCKS_PROXY_RE = /^x?socks:\/\//;
var HTTPS_PROXY_RE = /^x?https-proxy:\/\//;
var X_RE = /^x/;
var proxy, server;

function handleWebsocket(socket, clientIp, clientPort) {
  var wss = socket.isHttps;
  clientIp = util.removeIPV6Prefix(clientIp || socket.remoteAddress);
  socket.clientIp = clientIp;
  socket.method = 'GET';
  socket.reqId = util.getReqId();
  socket.clientPort = clientPort || socket.remotePort;
  socket.rules = rules.initRules(socket);
  var urlParamsRule = socket.rules.urlParams;
  util.parseRuleJson(urlParamsRule, function(urlParams) {
    if (urlParams) {
      var _url = util.replaceUrlQueryString(socket.url, urlParams);
      if (socket.url !== _url) {
        socket.url = _url;
        socket.fullUrl = util.getFullUrl(socket).replace('http', 'ws');
        socket.curUrl = socket.fullUrl;
        socket.rules = rules.resolveRules(socket);
        socket.rules.urlParams = urlParamsRule;
        if (socket.headerRulesMgr) {
          var _rules = socket.rules;
          socket.rules = socket.headerRulesMgr.resolveRules(socket);
          util.mergeRules(socket, _rules);
        }
      }
    }
    resolveWebsocket(socket, wss);
  });
}

function resolveWebsocket(socket, wss) {
  var headers = socket.headers;
  var reqEmitter = new EventEmitter();
  var fullUrl = socket.fullUrl;
  var _rules = socket.rules;
  var clientIp = socket.clientIp;
  rules.resolveRulesFile(socket, function() {
    var filter = socket.filter;
    var now = Date.now();
    var reqData = {
      ip: clientIp,
      port: socket.clientPort,
      method: 'GET',
      httpVersion: socket.httpVersion || '1.1',
      headers: headers,
      rawHeaderNames: socket.rawHeaderNames
    };
    var resData = {};
    var data = reqEmitter.data = {
      id: socket.reqId,
      url: fullUrl,
      startTime: now,
      rules: _rules,
      req: reqData,
      res: resData,
      rulesHeaders: socket.rulesHeaders
    };

    var reqSocket, options, pluginRules, matchedUrl, isInternalProxy, done, proxyUrl;
    var timeout = util.setTimeout(function() {
      destroy(new Error('Timeout'));
    });
    var response = function() {
      var statusCode = util.getMatcherValue(_rules.statusCode);
      if (!statusCode) {
        return;
      }
      var status = util.getStatusCode(statusCode);
      var resHeaders = resData.headers = {};
      var body = '';
      var statusMsg;
      if (status === 101) {
        statusMsg = 'HTTP/1.1 101 Switching Protocols';
        var protocol = (headers['sec-websocket-protocol'] || '').split(/, */);
        var key = headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
        key = crypto.createHash('sha1')
          .update(key, 'binary')
          .digest('base64');
        resHeaders['Sec-WebSocket-Accept'] = key;
        resHeaders.Upgrade = 'websocket';
        resHeaders.Connection = 'Upgrade';
        if (protocol[0]) {
          resHeaders['Sec-WebSocket-Protocol'] = protocol[0];
        }
        reqSocket = util.getEmptyRes();
        reqSocket.headers = resHeaders;
        socketMgr.handleUpgrade(socket, reqSocket);
        data.codec = reqSocket._codecRule;
      } else {
        if (!status) {
          status = 502;
          body = 'Invalid status code: ' + statusCode;
          resHeaders['Content-Type'] = 'text/html; charset=utf8';
          resHeaders['Content-Length'] = Buffer.byteLength(body) + '';
        }
        resHeaders.Connection = 'close';
        statusMsg = 'HTTP/1.1 ' + status;
      }
      resData.statusCode = status;
      resData.body = body;
      data.requestTime = data.dnsTime =Date.now();
      var rawData = statusMsg + '\r\n' + getRawHeaders(resHeaders) + '\r\n\r\n' + body;
      var end = function() {
        data.responseTime = data.endTime = Date.now();
        socket.write(rawData);
        reqEmitter.emit('end', data);
      };
      var reqDelay = util.getMatcherValue(_rules.reqDelay) | 0;
      var resDelay = util.getMatcherValue(_rules.resDelay) | 0;
      var delay = reqDelay + resDelay;
      if (delay > 0) {
        clearTimeout(timeout);
        setTimeout(end, delay);
      } else {
        end();
      }
      return true;
    };

    var plugin = pluginMgr.resolveWhistlePlugins(socket);
    pluginMgr.getRules(socket, function(rulesMgr) {
      if (pluginRules = rulesMgr) {
        socket.curUrl = fullUrl;
        util.mergeRules(socket, rulesMgr.resolveRules(socket));
        if (util.isIgnored(filter, 'rule')) {
          plugin = null;
        } else {
          plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
        }
      }

      var ruleUrlValue = plugin ? null : util.rule.getUrl(_rules.rule);
      if (ruleUrlValue && fullUrl !== ruleUrlValue && /^(ws|http)s?:\/\//.test(ruleUrlValue)) {
        if (RegExp.$1 === 'http') {
          ruleUrlValue = ruleUrlValue.replace('http', 'ws');
        }
        data.realUrl = fullUrl = matchedUrl = util.encodeNonLatin1Char(ruleUrlValue);
      }
      if (_rules.referer) {
        var referer = util.getMatcherValue(_rules.referer);
        headers.referer = referer;
      }
      if (_rules.ua) {
        var ua = util.getMatcherValue(_rules.ua);
        headers['user-agent'] = ua;
      }
      if (!filter.hide) {
        data.abort = destroy;
        proxy.emit('request', reqEmitter);
      }
      if (socket.enable.abort || filter.abort) {
        return destroy();
      }
      if (response()) {
        return;
      }
      pluginMgr.loadPlugin(plugin, function(err, ports) {
        if (err) {
          return execCallback(err);
        }
        options = util.parseUrl(fullUrl);
        var port = ports && ports.port;
        if (port) {
          options.port = port;
          data.realUrl = util.changePort(fullUrl, options.port);
          socket.customParser = util.getParserStatus(socket);
          pluginMgr.addRuleHeaders(socket, _rules);
          socketMgr.setPending(socket);
          options.protocol = 'ws:';
          socket.headers[config.PLUGIN_HOOK_NAME_HEADER] = config.PLUGIN_HOOKS.HTTP;
          connectServer();
          return;
        }
        plugin = null;
        rules.getProxy(fullUrl, plugin ? null : socket, function(err, hostIp, hostPort) {
          proxyUrl = !plugin && _rules.proxy ? util.rule.getMatcher(_rules.proxy) : null;
          if (proxyUrl) {
            var isXProxy = X_RE.test(proxyUrl);
            var isSocks = SOCKS_PROXY_RE.test(proxyUrl);
            var isHttpsProxy = !isSocks && HTTPS_PROXY_RE.test(proxyUrl);
            isInternalProxy = INTERNAL_PROXY_RE.test(proxyUrl);
            var isHttps2HttpProxy = isInternalProxy || HS2H_PROXY_RE.test(proxyUrl);
            if (!isHttps2HttpProxy && !wss && H2HS_PROXY_RE.test(proxyUrl)) {
              wss = true;
            } else {
              wss = options.protocol === 'wss:';
            }
            proxyUrl = 'http:' + util.removeProtocol(proxyUrl);
            getServerIp(proxyUrl, function(ip) {
              var proxyOptions = url.parse(proxyUrl);
              proxyOptions.port = parseInt(proxyOptions.port, 10) || (isSocks ? 1080 : (isHttpsProxy ? 443 : 80));
              var isProxyPort = proxyOptions.port == config.port;
              if (isProxyPort && util.isLocalAddress(ip)) {
                return execCallback(new Error('Unable to proxy to itself (' + ip + ':' + config.port + ')'));
              }
    
              options.proxyHost = ip;
              resData.port = options.proxyPort = proxyOptions.port;
              options.host = options.hostname;
              if (!options.port) {
                options.port = wss ? 443 : 80;
              }
    
              var handleProxy = function(proxySocket) {
                if (wss) {
                  proxySocket = tls.connect({
                    rejectUnauthorized: false,
                    socket: proxySocket,
                    servername: options.hostname
                  }).on('error', execCallback);
                }
    
                reqSocket = proxySocket;
                abortIfUnavailable(reqSocket);
                pipeData();
              };
              if (isSocks) {
                options.localDNS = false;
                options.auths = config.getAuths(proxyOptions);
              } else {
                var proxyHeaders = options.headers = socket.disable.proxyUA ? {} :
                    { 'user-agent': config.PROXY_UA };
                if (!util.isLocalAddress(clientIp)) {
                  proxyHeaders[config.CLIENT_IP_HEAD] = clientIp;
                }
                if(isProxyPort) {
                  proxyHeaders[config.WEBUI_HEAD] = 1;
                } else if (isHttps2HttpProxy) {
                  if (isInternalProxy) {
                    if (wss) {
                      headers[config.HTTPS_FIELD] = 1;
                    }
                    proxyHeaders[config.WHISTLE_POLICY_HEADER] = 'intercept';
                  }
                  wss = false;
                }
                util.checkIfAddInterceptPolicy(proxyHeaders, headers);
                util.setClientId(proxyHeaders, socket.enable, socket.disable, clientIp);
                options.proxyAuth = proxyOptions.auth;
              }
              var netMgr = isSocks ? socks : config;
              var reqDelay = util.getMatcherValue(_rules.reqDelay);
              var proxyOpts = util.setProxyHost(socket, options);
              if (isHttpsProxy) {
                proxyOpts.proxyServername = proxyOptions.hostname;
              }
              var connectProxy = function() {
                if (destroyed) {
                  return;
                }
                var s = netMgr.connect(proxyOpts, handleProxy);
                s.on('error', isXProxy ? directConnect  : execCallback);
              };
              if (reqDelay > 0) {
                clearTimeout(timeout);
                setTimeout(function() {
                  timeout = util.setTimeout(function() {
                    destroy(new Error('Timeout'));
                  });
                  connectProxy();
                }, reqDelay);
              } else {
                connectProxy();
              }
            });
          } else {
            directConnect(hostIp, hostPort);
          }
        });
      });
    });

    function directConnect(hostIp, hostPort) {
      if (typeof hostIp !== 'string') {
        hostIp = null;
      }
      connectServer(hostIp, hostPort);
    }
    var retryConnect;
    var auto2http;
    var retryXHost = 0;
    function connectServer(hostIp, hostPort) {
      getServerIp(fullUrl, function(ip, port) {
        var isWss = options.protocol === 'wss:';
        var _port = port;
        resData.port = port = port || options.port || (isWss ? 443 : 80);
        if (destroyed) {
          return;
        }
        // checkHandUpError, retry
        reqSocket = (isWss ? tls : net).connect({
          rejectUnauthorized: false,
          host: ip,
          port: port,
          servername: options.hostname
        }, pipeData);
        if (retryConnect) {
          abortIfUnavailable(reqSocket);
        } else {
          retryConnect = function(e) {
            if (retryXHost < 2 && _rules.host && X_RE.test(_rules.host.matcher)) {
              ++retryXHost;
              retryConnect = false;
              if (retryXHost > 1) {
                socket.curUrl = fullUrl;
                rules.lookupHost(socket, function(err, _ip) {
                  socket.hostIp = resData.ip = _ip || LOCALHOST;
                  if (err) {
                    return execCallback(err);
                  }
                  connectServer(_ip);
                });
                return;
              }
            } else if (isWss && util.checkAuto2Http(socket, ip)) {
              if (auto2http || util.checkTlsError(e)) {
                options.protocol = null;
              } else {
                retryConnect = false;
                auto2http = true;
              }
            }
            connectServer(ip, _port);
          };
          reqSocket.once('error', retryConnect);
        }
      }, hostIp, hostPort);
    }

    function pipeData() {
      if (retryConnect) {
        reqSocket.removeListener('error', retryConnect);
        abortIfUnavailable(reqSocket);
        retryConnect = null;
      }
      clearTimeout(timeout);
      var resDelay = util.getMatcherValue(_rules.resDelay);
      if (resDelay > 0) {
        setTimeout(_pipeData, resDelay);
      } else {
        _pipeData();
      }
    }

    function _pipeData() {
      var headers = socket.headers;
      var origin;
      if (matchedUrl) {
        headers.host = options.host;
        origin = headers.origin;
        headers.origin = (options.protocol == 'wss:' ? 'https://' : 'http://') + options.host;
      }
      var reqCors = util.getReqCors(_rules.reqCors);
      var cors = reqCors ? null : _rules.reqCors;

      util.parseRuleJson([_rules.reqHeaders, cors, _rules.reqCookies, _rules.params, _rules.urlReplace],
      function(reqHeaders, _reqCors, reqCookies, params, urlReplace) {
        var customXFF;
        if (reqHeaders) {
          reqHeaders = util.lowerCaseify(reqHeaders, socket.rawHeaderNames);
          customXFF = reqHeaders['x-forwarded-for'];
          extend(headers, reqHeaders);
        }
        var reqRuleData = { headers: headers };
        util.setReqCors(reqRuleData, _reqCors || reqCors);
        util.setReqCookies(reqRuleData, reqCookies, headers.cookie);
        if (params) {
          var _url = util.replaceUrlQueryString(fullUrl, params);
          if (fullUrl !== _url) {
            data.realUrl = fullUrl = _url;
            options = util.parseUrl(fullUrl);
          }
        }
        data.realUrl = fullUrl = util.parsePathReplace(fullUrl, urlReplace) || fullUrl;
        if (socket.disable.clientIp || socket.disable.clientIP) {
          delete headers[config.CLIENT_IP_HEAD];
        } else {
          var forwardedFor = util.getMatcherValue(_rules.forwardedFor);
          if (forwardedFor) {
            headers[config.CLIENT_IP_HEAD] = forwardedFor;
          } else if (!customXFF && !config.keepXFF
            && (!plugin || util.isLocalAddress(headers[config.CLIENT_IP_HEAD]))) {
            delete headers[config.CLIENT_IP_HEAD];
          }
        }
        if (_rules.referer) {
          headers.referer = util.getMatcherValue(_rules.referer);
        }
        var delReqHeaders = util.parseDeleteProperties(socket).reqHeaders;
        Object.keys(delReqHeaders).forEach(function(name) {
          delete headers[name];
        });
        util.disableReqProps(socket);
        proxyUrl ? util.setClientId(headers, socket.enable, socket.disable, clientIp) : util.removeClientId(headers);
        reqSocket.write(socket.getBuffer(headers, options.path));
        delete headers[config.HTTPS_FIELD];
        parseReq(reqSocket, function(err, res) {
          if (err) {
            return execCallback(err);
          }
          socket.statusCode = res.statusCode || '';
          socket.resHeaders = res.headers;
          pluginMgr.getResRules(socket, res, function() {
            var cors = _rules.resCors;
            var resCors = util.parseResCors(cors);
            if (resCors) {
              cors = null;
            }
            util.parseRuleJson([_rules.resHeaders, cors, _rules.resCookies],
            function(resHeaders, cors, cookies) {
              reqSocket.headers = headers = extend(res.headers, resHeaders);
              if (matchedUrl) {
                headers['access-control-allow-origin'] = origin;
              }
              var resRuleData = { headers: headers };
              util.setResCors(resRuleData, resCors, cors, socket.headers.origin);
              util.setResCookies(resRuleData, cookies);
              util.setResponseFor(_rules, headers, socket.headers, socket.hostIp);
              var delResHeaders = util.parseDeleteProperties(socket).resHeaders;
              Object.keys(delResHeaders).forEach(function(name) {
                delete headers[name];
              });
              util.disableResProps(socket, headers);
              socket.write(res.getBuffer(headers));
              reqSocket.reqId = data.id;
              if (res.statusCode == 101) {
                socketMgr.handleUpgrade(socket, reqSocket);
                data.codec = reqSocket._codecRule;
              } else {
                resData.body = res.body;
                socket.destroy();
              }
              resData.headers = headers;
              resData.rawHeaderNames = res.rawHeaderNames;
              resData.statusCode = res.statusCode;
              reqEmitter.emit('response', data);
              execCallback(null, reqSocket);
            });
          });
        }, true);
      });
    }

    function getServerIp(url, callback, hostIp, hostPort) {
      if (plugin) {
        return callback(LOCALHOST);
      }
      var hostHandler = function(err, ip, port, host) {
        if (err) {
          return execCallback(err);
        }

        if (host) {
          _rules.host = host;
        }
        socket.hostIp = resData.ip = util.getHostIp(ip, port);
        data.requestTime = data.dnsTime = Date.now();
        reqEmitter.emit('send', data);
        callback(ip, port);
      };
      if (hostIp) {
        hostHandler(null, hostIp, hostPort);
      } else {
        socket.curUrl = url;
        rules.resolveHost(socket, hostHandler, pluginRules, socket.rulesFileMgr, socket.headerRulesMgr);
      }
    }

    function abortIfUnavailable(socket) {
      return socket.on('error', destroy).on('close', destroy);
    }
    var destroyed;
    function destroy(err) {
      if (destroyed) {
        return;
      }
      destroyed = true;
      socket.destroy();
      reqSocket && reqSocket.destroy();
      execCallback(err);
    }

    function execCallback(err, _socket) {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timeout);
      data.responseTime = data.endTime = Date.now();
      socket.hostIp = resData.ip = resData.ip || LOCALHOST;
      if (!err && !_socket) {
        err = new Error('Aborted');
        data.reqError = true;
        resData.statusCode ='aborted';
        reqData.body = util.getErrorStack(err);
        reqEmitter.emit('abort', data);
      } else if (err) {
        data.resError = true;
        resData.statusCode = resData.statusCode || 502;
        resData.body = util.getErrorStack(err);
        util.emitError(reqEmitter, data);
      } else {
        reqEmitter.emit('end', data);
      }
      if (err) {
        resData.headers = {'x-server':'whistle' };
        pluginMgr.getResRules(socket, resData, util.noop);
      }
    }
  });
}

function addReqInfo(req) {
  var clientPort = req.socket.remotePort;
  var serverPort = req.socket.localPort;
  var remoteData = tunnelTmplData.get(clientPort + ':' + serverPort);
  req.headers[config.HTTPS_FIELD] = 1;
  if (remoteData) {
    req.headers[config.CLIENT_IP_HEAD] = remoteData.clientIp || LOCALHOST;
    req.headers[config.CLIENT_PORT_HEAD] = remoteData.clientPort;
  }
}

var handlers = {
  request: function(req, res) {
    addReqInfo(req);
    server.emit('request', req, res);
  },
  upgrade: function(req, socket) {
    addReqInfo(req);
    server.emit('upgrade', req, socket);
  }
};

var CONNECT_RE = /^CONNECT\s+(\S+)\s+HTTP\/1.\d$/mi;
var HTTP_RE = /^\w+\s+\S+\s+HTTP\/1.\d$/mi;

module.exports = function(socket, hostname, next, isWebPort) {
  var reqSocket, destroyed, timer;
  var tunnelHost = socket.tunnelHost;
  var isConnect, headersStr;
  function destroy(err) {
    if (destroyed) {
      return;
    }
    destroyed = true;
    socket.destroy(err);
    reqSocket && reqSocket.destroy();
  }

  function abortIfUnavailable(socket) {
    return socket.on('error', destroy);
  }

  socket.on('data', request);
  socket.on('end', request);
  var clientIp = socket.clientIp;
  var timeout = isWebPort ? null : (util.isLocalAddress(clientIp) ? LOCAL_TIMEOUT : TIMEOUT);
  timer = timeout && setTimeout(request, timeout);
  function request(chunk) {
    clearTimeout(timer);
    headersStr = chunk && chunk.toString();
    if (chunk && !isConnect && CONNECT_RE.test(headersStr)) {
      isConnect = true;
      tunnelHost = RegExp.$1;
      hostname = tunnelHost.split(':')[0];
      timer = timeout && setTimeout(request, timeout);
      util.setEstablished(socket);
      return;
    }
    socket.removeListener('data', request);
    socket.removeListener('end', request);
    if (!chunk) {//没有数据
      return isWebPort ? socket.destroy() : next(chunk);
    }
    var clientPort = socket.remotePort;
    if (HTTP_RE.test(headersStr)) {
      socket.test = clientPort;
      var statusLine = RegExp['$&'];
      var len = Buffer.byteLength(statusLine);
      server.emit('connection', socket);
      chunk = chunk.slice(len);
      statusLine += '\r\n' + config.CLIENT_INFO_HEAD + ': ' + clientIp + ',' + clientPort;
      socket.emit('data', Buffer.concat([Buffer.from(statusLine), chunk]));
    } else if (chunk[0] != 22) {
      next(chunk);
    } else {
      var domain = getDomain(hostname);
      var recieveData, authTimer;
      var useSNI = !serverAgent.existsServer(domain) && checkSNI(chunk);
      socket.pause();
      var checkTimeout = function() {
        authTimer = setTimeout(function() {
          if (reqSocket) {
            recieveData && reqSocket.removeListener('data', recieveData);
            reqSocket.destroy();
          }
          if (useSNI) {
            useSNI = false;
            useNoSNIServer();
          } else {
            next(chunk);
          }
        }, AUTH_TIMEOUT);
      };
      var handleConnect = function(port) {
        util.connect({
          port: port,
          host: LOCALHOST,
          localAddress: LOCALHOST
        }, function(err, s) {
          if (err) {
            return destroy(err);
          }
          reqSocket = s;
          tunnelTmplData.set(reqSocket.localPort + ':' + reqSocket.remotePort, {
            clientIp: clientIp,
            clientPort: socket.remotePort,
            tunnelHost: tunnelHost
          });
          recieveData = function(data) {
            clearTimeout(authTimer);
            authTimer = null;
            socket.write(data);
            reqSocket.pipe(socket).pipe(reqSocket);
            socket.resume();
          };
          reqSocket.once('data', recieveData);
          reqSocket.write(chunk);
          abortIfUnavailable(reqSocket);
        });
      };
      var useNoSNIServer = function() {
        checkTimeout();
        serverAgent.createServer(domain, handlers, handleConnect);
      };
      
      if(useSNI) {
        checkTimeout();
        getSNIServer(handlers, handleConnect);
      } else {
        useNoSNIServer();
      }
    }
  }
};
module.exports.setup = function(s, p) {
  server = s;
  proxy = p;
};
module.exports.handleWebsocket = handleWebsocket;


