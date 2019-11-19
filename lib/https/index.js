var net = require('net');
var tls = require('tls');
var http = require('http');
var url = require('url');
var socks = require('sockx');
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
var properties = require('../rules/util').properties;
var ca = require('./ca');
var h2Consts = config.enableH2 ? require('http2').constants : {};

var STATUS_CODES = http.STATUS_CODES || {};
var getRawHeaders = hparser.getRawHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var formatHeaders = hparser.formatHeaders;
var parseReq = hparser.parse;
var getDomain = ca.getDomain;
var serverAgent = ca.serverAgent;
var getSNIServer = ca.getSNIServer;
var LOCALHOST = '127.0.0.1';
var tunnelTmplData = new LRU({max: 3000, maxAge: 30000});
var TIMEOUT = 5000;
var CONN_TIMEOUT = 60000;
var X_RE = /^x/;
var proxy, server;

function handleWebsocket(socket, clientIp, clientPort) {
  var wss = socket.isHttps;
  clientIp = util.removeIPV6Prefix(clientIp || socket.remoteAddress);
  socket.clientIp = clientIp;
  socket.method = 'GET';
  socket.reqId = util.getReqId();
  socket.clientPort = clientPort || socket.remotePort;
  pluginMgr.resolvePipePlugin(socket, function() {
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
    var data = {
      id: socket.reqId,
      url: fullUrl,
      startTime: now,
      rules: _rules,
      req: reqData,
      res: resData,
      pipe: socket._pipeRule,
      rulesHeaders: socket.rulesHeaders
    };

    var reqSocket, options, pluginRules, isInternalProxy, origProto, isHttpsInternal, done, proxyUrl;
    var timeout = setTimeout(function() {
      destroy(new Error('Timeout'));
    }, CONN_TIMEOUT);
    var handleResponse = function() {
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
      getResRules(socket, resData, function() {
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
      });
        
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
        data.realUrl = fullUrl = util.encodeNonLatin1Char(ruleUrlValue);
      }
      if (_rules.referer) {
        var referer = util.getMatcherValue(_rules.referer);
        headers.referer = referer;
      }
      if (_rules.ua) {
        var ua = util.getMatcherValue(_rules.ua);
        headers['user-agent'] = ua;
      }
      if (!socket.isPluginReq && !socket.isInternalUrl && !config.rulesMode && (!filter.hide || socket.disable.hide)) {
        data.abort = destroy;
        proxy.emit('request', reqEmitter, data);
      }
      setupSocket(function() {
        if (socket.enable.abort || filter.abort) {
          return destroy();
        }
        if (handleResponse()) {
          return;
        }
        
        pluginMgr.loadPlugin(plugin, function(err, ports) {
          if (err) {
            return execCallback(err);
          }
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
          rules.getProxy(fullUrl, socket, function(err, hostIp, hostPort) {
            var proxyRule = _rules.proxy;
            var connectProxy;
            var send = function() {
              if (connectProxy) {
                connectProxy();
              } else {
                connectServer(hostIp, hostPort);
              }
            };
            var connect = function() {
              var reqDelay = util.getMatcherValue(_rules.reqDelay);
              if (reqDelay > 0) {
                clearTimeout(timeout);
                setTimeout(function() {
                  timeout = setTimeout(function() {
                    destroy(new Error('Timeout'));
                  }, CONN_TIMEOUT);
                  send();
                }, reqDelay);
              } else {
                send();
              }
            };
            proxyUrl = proxyRule ? util.rule.getMatcher(proxyRule) : null;
            if (proxyUrl) {
              var isXProxy = X_RE.test(proxyUrl);
              var isSocks = proxyRule.isSocks;
              var isHttpsProxy = proxyRule.isHttps;
              isHttpsInternal = proxyRule.isHttpsInternal;
              isInternalProxy = proxyRule.isInternal;
              var isHttps2HttpProxy = isInternalProxy || proxyRule.isHttps2http;
              if (!isHttps2HttpProxy && !wss && proxyRule.isHttp2https) {
                wss = true;
              } else {
                wss = options.protocol === 'wss:';
              }
              proxyUrl = 'http:' + util.removeProtocol(proxyUrl);
              getServerIp(proxyUrl, function(ip) {
                var proxyOptions = url.parse(proxyUrl);
                hostPort = proxyOptions.port;
                hostIp = ip;
                var proxyPort = proxyOptions.port = parseInt(hostPort, 10) || (isSocks ? 1080 : (isHttpsProxy ? 443 : 80));
                var isProxyPort = util.isProxyPort(proxyPort);
                if (isProxyPort && util.isLocalAddress(ip)) {
                  return execCallback(new Error('Self loop (' + ip + ':' + proxyPort + ')'));
                }
      
                options.proxyHost = ip;
                resData.port = options.proxyPort = proxyPort;
                options.host = options.hostname;
                if (!options.port) {
                  options.port = wss ? 443 : 80;
                }
                var proxyOpts;
                var handleProxy = function(proxySocket) {
                  if (wss) {
                    proxySocket = tls.connect({
                      rejectUnauthorized: false,
                      socket: proxySocket,
                      servername: options.hostname
                    });
                    proxySocket.on('error', function(err) {
                      if (connectProxy && util.checkTlsError(err) && util.checkAuto2Http(socket, ip, proxyUrl)) {
                        wss = false;
                        data.useHttp = true;
                        if (proxyOpts && options.port == 443) {
                          proxyOpts.port = options.port = 80;
                          proxyOpts.headers.host = proxyOpts.host + ':' + proxyOpts.port;
                        }
                        connectProxy();
                      } else {
                        execCallback(err);
                      }
                    });
                    reqSocket = proxySocket;
                    proxySocket.on('secureConnect', function() {
                      abortIfUnavailable(reqSocket);
                      pipeData();
                    });
                    return;
                  }
                  reqSocket = proxySocket;
                  abortIfUnavailable(reqSocket);
                  pipeData();
                };
                if (isSocks) {
                  options.localDNS = false;
                  options.auths = config.getAuths(proxyOptions);
                } else {
                  var proxyHeaders = options.headers = {};
                  var ua = !socket.disable.proxyUA && headers['user-agent'];
                  if (ua) {
                    proxyHeaders['user-agent'] = ua;
                  }
                  if (!util.isLocalAddress(clientIp)) {
                    proxyHeaders[config.CLIENT_IP_HEAD] = clientIp;
                  }
                  if(isProxyPort) {
                    proxyHeaders[config.WEBUI_HEAD] = 1;
                  }
                  if (isHttps2HttpProxy) {
                    if (isInternalProxy && wss) {
                      headers[config.HTTPS_FIELD] = 1;
                      options.protocol = null;
                      origProto = 'wss:';
                    }
                    wss = false;
                  }
                  util.checkIfAddInterceptPolicy(proxyHeaders, headers);
                  util.setClientId(proxyHeaders, socket.enable, socket.disable, clientIp);
                  options.proxyAuth = proxyOptions.auth;
                }
                var netMgr = isSocks ? socks : config;
                proxyOpts = util.setProxyHost(socket, options);
                if (isHttpsProxy) {
                  proxyOpts.proxyServername = proxyOptions.hostname;
                }
                connectProxy = isInternalProxy ? null : function() {
                  if (destroyed) {
                    return;
                  }
                  if (socket._phost) {
                    resData.phost = socket._phost.host;
                  }
                  try {
                    var s = netMgr.connect(proxyOpts, handleProxy);
                    s.on('error', isXProxy ? function() {
                      if (isXProxy) {
                        isXProxy = false;
                        resData.phost = undefined;
                        connectServer();
                      }
                    }  : execCallback);
                  } catch (e) {
                    execCallback(e);
                  }
                };
                connect();
              });
            } else {
              connect();
            }
          });
        });
      });
    });

    var retryConnect, auto2http;
    var retryXHost = 0;
    function connectServer(hostIp, hostPort) {
      getServerIp(fullUrl, function(ip, port) {
        var isWss = isHttpsInternal || options.protocol === 'wss:';
        var _port = port;
        resData.port = port = port || options.port || (isWss ? 443 : 80);
        if (destroyed) {
          return;
        }
        if (util.isProxyPort(port) && util.isLocalAddress(ip)) {
          return execCallback(new Error('Self loop (' + ip + ':' + port + ')'));
        }
        // checkHandUpError, retry
        try {
          reqSocket = (isWss ? tls : net).connect({
            rejectUnauthorized: false,
            host: ip,
            port: port,
            servername: util.parseHost(headers.host)[0] || options.hostname
          }, pipeData);
        } catch (e) {
          return execCallback(e);
        }
        if (retryConnect) {
          abortIfUnavailable(reqSocket);
        } else {
          retryConnect = function(e) {
            if (retryXHost < 2 && (
              (_rules.host && X_RE.test(_rules.host.matcher)) ||
              (isInternalProxy && X_RE.test(proxyUrl))
            )) {
              ++retryXHost;
              retryConnect = false;
              if (retryXHost > 1) {
                if (isHttpsInternal) {
                  isHttpsInternal = false;
                  options.protocol = origProto;
                }
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
            } else if (isWss && util.checkAuto2Http(socket, ip, proxyUrl)) {
              if (auto2http || util.checkTlsError(e)) {
                options.protocol = null;
                data.useHttp = true;
              } else {
                retryConnect = false;
                auto2http = true;
              }
            }
            connectServer(ip, _port);
          };
          var retried;
          // 不要用once，防止多次触发error导致crash
          reqSocket.on('error', function() {
            if (!retried) {
              retried = true;
              this.destroy && this.destroy();
              !destroyed && retryConnect && retryConnect();
            }
          });
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
      proxyUrl ? util.setClientId(headers, socket.enable, socket.disable, clientIp) : util.removeClientId(headers);
      reqSocket.write(socket.getBuffer(headers, options.path));
      delete headers[config.HTTPS_FIELD];
      var resDelay = util.getMatcherValue(_rules.resDelay);
      if (resDelay > 0) {
        setTimeout(_pipeData, resDelay);
      } else {
        _pipeData();
      }
    }

    function setupSocket(cb) {
      var list = [_rules.reqHeaders, _rules.reqCors, _rules.reqCookies, _rules.params, _rules.urlReplace];
      util.parseRuleJson(list, function(reqHeaders, reqCors, reqCookies, params, urlReplace) {
        var newUrl = params ? util.replaceUrlQueryString(fullUrl, params) : fullUrl;
        newUrl = util.parsePathReplace(newUrl, urlReplace) || newUrl;
        if (newUrl !== fullUrl) {
          fullUrl = newUrl;
          options = util.parseUrl(fullUrl);
        } else {
          options = util.parseUrl(fullUrl);
        }
        data.realUrl = fullUrl;
        var host = headers.host = options.host;
        var origin = headers.origin;
        if (origin) {
          headers.origin = (options.protocol == 'wss:' ? 'https://' : 'http://') + options.host;
        }
        socket._origin = origin;
        var customXFF;
        if (reqHeaders) {
          reqHeaders = util.lowerCaseify(reqHeaders, socket.rawHeaderNames);
          customXFF = reqHeaders[config.CLIENT_IP_HEAD];
          extend(headers, reqHeaders);
          headers.host = headers.host || host;
        }
        var reqRuleData = { headers: headers };
        util.setReqCors(reqRuleData, reqCors);
        util.setReqCookies(reqRuleData, reqCookies, headers.cookie);
        if (_rules.referer) {
          headers.referer = util.getMatcherValue(_rules.referer);
        }
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
          
        var delReqHeaders = util.parseDeleteProperties(socket).reqHeaders;
        Object.keys(delReqHeaders).forEach(function(name) {
          delete headers[name];
        });
        util.disableReqProps(socket);
        pluginMgr.postStats(socket);
        cb();
      });
    }

    function getResRules(socket, res, callback) {
      socket.statusCode = res.statusCode || '';
      var curResHeaders = socket.resHeaders = res.headers;
      pluginMgr.getResRules(socket, res, function() {
        util.parseRuleJson([_rules.resHeaders, _rules.resCors, _rules.resCookies],
                function(resHeaders, cors, cookies) {
                  if (resHeaders) {
                    resHeaders = util.lowerCaseify(resHeaders, res.rawHeaderNames);
                    extend(res.headers, resHeaders);
                  }
                  var origin = curResHeaders['access-control-allow-origin'];
                  if (socket._origin && origin && origin !== '*') {
                    curResHeaders['access-control-allow-origin'] = socket._origin;
                  }
                  var resRuleData = { headers: curResHeaders };
                  util.setResCors(resRuleData, cors, socket.headers.origin);
                  util.setResCookies(resRuleData, cookies);
                  util.setResponseFor(_rules, curResHeaders, socket, socket.hostIp);
                  var delResHeaders = util.parseDeleteProperties(socket).resHeaders;
                  Object.keys(delResHeaders).forEach(function(name) {
                    delete curResHeaders[name];
                  });
                  util.disableResProps(socket, curResHeaders);
                  callback();
                });
      });
    }

    function _pipeData() {
      parseReq(reqSocket, function(err, res) {
        if (err) {
          return execCallback(err);
        }
        socket.statusCode = res.statusCode || '';
        socket.resHeaders = res.headers;
        var curResHeaders = reqSocket.headers = res.headers;
        getResRules(socket, res, function() {
          reqSocket.reqId = data.id;
          if (res.statusCode == 101) {
            socket.write(res.getBuffer(curResHeaders));
            socketMgr.handleUpgrade(socket, reqSocket);
          } else {
            resData.body = res.body;
            socket.destroy();
          }
          resData.headers = curResHeaders;
          resData.rawHeaderNames = res.rawHeaderNames;
          resData.statusCode = res.statusCode;
          reqEmitter.emit('response', data);
          execCallback(null, reqSocket);
        });
      }, true);
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
    var destroyed, reqDestroyed, resDestroyed;
    function destroy(err) {
      if (!reqDestroyed) {
        reqDestroyed = true;
        socket.destroy();
      }
      if (reqSocket && !resDestroyed) {
        resDestroyed = true;
        reqSocket.destroy();
      }
      if (destroyed) {
        return;
      }
      destroyed = true;
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
        destroy(err);
      } else {
        reqEmitter.emit('end', data);
      }
      if (err) {
        resData.headers = {'x-server':'whistle' };
      }
      pluginMgr.postStats(socket, _socket || resData);
    }
  });
}

function addReqInfo(req) {
  var socket = req.socket;
  var remoteData = socket._remoteDataInfo || tunnelTmplData.get(socket.remotePort + ':' + socket.localPort);
  req.headers[config.HTTPS_FIELD] = 1;
  if (remoteData) {
    socket._remoteDataInfo = remoteData;
    req.headers[config.CLIENT_IP_HEAD] = remoteData.clientIp || LOCALHOST;
    req.headers[config.CLIENT_PORT_HEAD] = remoteData.clientPort;
    if (remoteData.clientId) {
      req.headers[config.CLIENT_ID_HEADER] = remoteData.clientId;
    }
  }
}

function getStatusMessage(obj) {
  return obj.statusMessage || STATUS_CODES[obj.code] || 'Unknown';
}

function isIllegalcHeader(name, value) {
  switch (name) {
  case h2Consts.HTTP2_HEADER_CONNECTION:
  case h2Consts.HTTP2_HEADER_UPGRADE:
  case h2Consts.HTTP2_HEADER_HOST:
  case h2Consts.HTTP2_HEADER_HTTP2_SETTINGS:
  case h2Consts.HTTP2_HEADER_KEEP_ALIVE:
  case h2Consts.HTTP2_HEADER_PROXY_CONNECTION:
  case h2Consts.HTTP2_HEADER_TRANSFER_ENCODING:
    return true;
  case h2Consts.HTTP2_HEADER_TE:
    return value !== 'trailers';
  default:
    return false;
  }
}

function formatRawHeaders(obj, isH2) {
  var headers = obj.headers;
  if (isH2) {
    var newHeaders = {};
    Object.keys(headers).forEach(function(name) {
      var value = headers[name];
      if (!isIllegalcHeader(name, value)) {
        newHeaders[name] = value;
      }
    });
    return newHeaders;
  }
  var rawNames = Array.isArray(obj.rawHeaders) && getRawHeaderNames(obj.rawHeaders);
  return formatHeaders(headers, rawNames);
}

function addStreamEvents(stream, handleError, handleAbort) {
  if (stream) {
    stream.on('error', handleError);
    stream.on('aborted', handleAbort);
    stream.on('close', handleAbort);
  }
}

function toHttp1(req, res) {
  var isH2 = req.httpVersion == 2;
  var client;
  var handleAbort = function() {
    if (client) {
      client.abort();
      res.destroy();
      client = null;
    }
  };
  var handleError = function(e) {
    e && handleAbort();
  };
  addReqInfo(req);
  addStreamEvents(req.stream, handleError, handleAbort);
  req.on('error', handleError);
  res.on('error', handleError);
  var host = req.headers[':authority'];
  var headers = req.headers;
  if (host) {
    req.headers.host = host;
    var newHeaders = { host: host };
    Object.keys(headers).forEach(function(name) {
      if (name[0] !== ':') {
        newHeaders[name] = headers[name];
      }
    });
    headers = newHeaders;
  } else {
    headers = formatRawHeaders(req);
  }
  var options = util.parseUrl(util.getFullUrl(req));
  options.protocol = null;
  options.hostname = null;
  options.agent = false;
  options.host = config.host;
  options.port = config.port;
  options.headers = headers;
  if (isH2) {
    headers[config.ALPN_PROTOCOL_HEADER] = 'h2';
  }
  options.method = req.method;
  client = http.request(options);
  client.on('error', handleError);
  client.on('response', function(svrRes) {
    svrRes.on('error', handleError);
    try {
      var code = svrRes.statusCode;
      res.writeHead(code, getStatusMessage(svrRes), formatRawHeaders(svrRes, isH2));
      var write = res.write;
      res.write = function(chunk) {
        return write.call(res, chunk, handleError);
      };
      svrRes.pipe(res);
    } catch (e) {
      handleError(e);
    }
  });
  req.pipe(client);
}

var handlers ={
  request: function(req, res) {
    addReqInfo(req);
    server.emit('request', req, res);
  },
  upgrade: function(req, socket) {
    addReqInfo(req);
    server.emit('upgrade', req, socket);
  }
};
var h2Handlers =  config.enableH2 ? {
  request: toHttp1,
  upgrade: handlers.upgrade
} : handlers;

var CONNECT_RE = /^CONNECT\s+(\S+)\s+HTTP\/1.\d$/mi;
var HTTP_RE = /^\w+\s+\S+\s+HTTP\/1.\d$/mi;

function addClientInfo(socket, chunk, statusLine, clientIp, clientPort) {
  var len = Buffer.byteLength(statusLine);
  chunk = chunk.slice(len);
  statusLine += '\r\n' + config.CLIENT_INFO_HEAD + ': ' + clientIp + ',' + clientPort;
  var clientId = socket.headers[config.CLIENT_ID_HEADER];
  if (clientId) {
    statusLine += '\r\n' + config.TEMP_CLIENT_ID_HEADER + ': ' + clientId;
  }
  return Buffer.concat([Buffer.from(statusLine), chunk]);
}

module.exports = function(socket, hostname, next, isWebPort) {
  var reqSocket, reqDestroyed, resDestroyed, timer;
  var tunnelHost = socket.tunnelHost;
  var headersStr, statusLine;
  function destroy(err) {
    if (reqSocket) {
      if (resDestroyed) {
        resDestroyed = true;
        reqSocket.destroy(err);
      }
    } else if (reqDestroyed) {
      reqDestroyed = true;
      socket.destroy(err);
    }
  }

  function abortIfUnavailable(socket) {
    return socket.on('error', destroy);
  }

  socket.on('data', request);
  socket.on('end', request);
  var clientIp = socket.clientIp;
  var clientPort = socket.clientPort;
  if (!isWebPort) {
    timer = setTimeout(request, TIMEOUT);
  }
  function request(chunk) {
    clearTimeout(timer);
    headersStr = chunk && chunk.toString();
    if (chunk && CONNECT_RE.test(headersStr)) {
      statusLine = RegExp['$&'];
      chunk = addClientInfo(socket, chunk, statusLine, clientIp, clientPort);
      socket.pause();
      socket.removeListener('data', request);
      socket.removeListener('end', request);
      util.connect({
        port: config.port,
        host: LOCALHOST
      }, function(err, s) {
        if (err) {
          return destroy(err);
        }
        reqSocket = s;
        reqSocket.write(chunk);
        reqSocket.pipe(socket).pipe(reqSocket);
        abortIfUnavailable(reqSocket);
        socket.resume();
      });
      return;
    }
    socket.removeListener('data', request);
    socket.removeListener('end', request);
    if (!chunk) {//没有数据
      return isWebPort ? socket.destroy() : next(chunk);
    }
    if (HTTP_RE.test(headersStr)) {
      statusLine = RegExp['$&'];
      server.emit('connection', socket);
      socket.emit('data', addClientInfo(socket, chunk, statusLine, clientIp, clientPort));
    } else if (chunk[0] != 22) {
      next(chunk);
    } else {
      var recieveData, authTimer;
      var useSNI = checkSNI(chunk);
      var domain = useSNI || domain;
      if (!domain) {
        return next(chunk);
      }
      domain = getDomain(domain);
      if (serverAgent.existsServer(domain)) {
        useSNI = false;
      }
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
        }, TIMEOUT);
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
            clientPort: clientPort,
            tunnelHost: tunnelHost,
            clientId: socket.headers[config.CLIENT_ID_HEADER]
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
        getSNIServer(h2Handlers, handleConnect, properties.get('enableHttp2') === false || util.isDisableH2(socket, true));
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


