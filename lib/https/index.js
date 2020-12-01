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
  rules.initHeaderRules(socket);
  pluginMgr.resolvePipePlugin(socket, function() {
    socket.rules = rules.initRules(socket);
    rules.resolveRulesFile(socket, function() {
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

  var reqSocket, options, pluginRules, isXProxy, isInternalProxy, isHInternal, isHttpsInternal, origProto, done, proxyUrl, clientKey, clientCert, isPfx;
  var timeout = setTimeout(function() {
    destroy(new Error('Timeout'));
  }, CONN_TIMEOUT);
  var handleResponse = function() {
    var statusCode = util.getStatusCodeFromRule(_rules);
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
    resData.ip = resData.ip || LOCALHOST;
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
        rules.getClientCert(socket, function(_key, _cert, _isPfx) {
          clientKey = _key;
          clientCert = _cert;
          isPfx = _isPfx;
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
              isXProxy = X_RE.test(proxyUrl);
              var isSocks = proxyRule.isSocks;
              isHttpsInternal = proxyRule.isHttpsInternal;
              isHInternal = proxyRule.isHttpInternal;
              isInternalProxy = proxyRule.isInternal;
              var isHttpsProxy = proxyRule.isHttps || isHttpsInternal;
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
                var proxyOpts, ciphers;
                var handleProxy = function(proxySocket) {
                  if (wss) {
                    var opts = {
                      rejectUnauthorized: config.rejectUnauthorized,
                      socket: proxySocket,
                      ciphers: ciphers
                    };
                    if (!socket.disable.servername) {
                      opts.servername = options.hostname;
                    }
                    util.setClientCert(opts, clientKey, clientCert, isPfx);
                    var handleProxyError = function(err) {
                      if (connectProxy && !ciphers && util.isCiphersError(err)) {
                        ciphers = util.getCipher(_rules);
                        connectProxy();
                      } else if (connectProxy && util.checkTlsError(err) && util.checkAuto2Http(socket, ip, proxyUrl)) {
                        wss = false;
                        data.httpsTime = data.httpsTime || Date.now();
                        data.useHttp = true;
                        if (proxyOpts && options.port == 443) {
                          proxyOpts.port = options.port = 80;
                          proxyOpts.headers.host = proxyOpts.host + ':' + proxyOpts.port;
                        }
                        connectProxy();
                      } else {
                        execCallback(err);
                      }
                    };
                    try {
                      proxySocket = tls.connect(opts);
                      proxySocket.on('error', handleProxyError);
                      reqSocket = proxySocket;
                      proxySocket.on('secureConnect', function() {
                        abortIfUnavailable(reqSocket);
                        pipeData();
                      });
                    } catch (e) {
                      handleProxyError(e);
                    }
                    return;
                  }
                  reqSocket = proxySocket;
                  abortIfUnavailable(reqSocket);
                  pipeData();
                };
                  // 对应 internal-proxy 要用直接请求，方便用来穿透 nginx
                if (isInternalProxy && !isHttpsInternal && !isHInternal) {
                  if (wss) {
                    headers[config.HTTPS_FIELD] = 1;
                    options.protocol = null;
                    origProto = 'wss:';
                    wss = false;
                  }
                } else {
                  if (isSocks) {
                    options.localDNS = false;
                    options.auths = config.getAuths(proxyOptions);
                  } else {
                    var proxyHeaders = options.headers = {};
                    var ua = !socket.disable.proxyUA && headers['user-agent'];
                    if (ua) {
                      proxyHeaders['user-agent'] = ua;
                    }
                    if (wss && (isInternalProxy || isHttps2HttpProxy)) {
                      headers[config.HTTPS_FIELD] = 1;
                      options.protocol = null;
                      origProto = 'wss:';
                      wss = false;
                    }
                    if (!util.isLocalAddress(clientIp)) {
                      proxyHeaders[config.CLIENT_IP_HEAD] = clientIp;
                    }
                    if(isProxyPort) {
                      proxyHeaders[config.WEBUI_HEAD] = 1;
                    }
                    util.checkIfAddInterceptPolicy(proxyHeaders, headers);
                    util.setClientId(proxyHeaders, socket.enable, socket.disable, clientIp, isInternalProxy);
                    options.proxyAuth = proxyOptions.auth;
                  }
                  var netMgr = isSocks ? socks : config;
                  proxyOpts = util.setProxyHost(socket, options);
                  if (isHttpsProxy) {
                    proxyOpts.proxyServername = proxyOptions.hostname;
                  }
                  connectProxy = function() {
                    if (destroyed) {
                      return;
                    }
                    if (socket._phost) {
                      resData.phost = socket._phost.host;
                    }
                    proxyOpts.enableIntercept = true;
                    proxyOpts.proxyTunnelPath = util.getProxyTunnelPath(socket, wss);
                    try {
                      var s = netMgr.connect(proxyOpts, handleProxy);
                      s.on('error', isXProxy ? function() {
                        if (isXProxy) {
                          isXProxy = false;
                          resData.phost = undefined;
                          if (isInternalProxy) {
                            options.protocol = origProto;
                          }
                          connectServer();
                        }
                      }  : execCallback);
                    } catch (e) {
                      execCallback(e);
                    }
                  };
                }
                connect();
              });
            } else {
              connect();
            }
          });
        });
      });
    });
  });

  var retryConnect, auto2http;
  var retryXHost = 0;
  function connectServer(hostIp, hostPort, ciphers) {
    getServerIp(fullUrl, function(ip, port) {
      var isWss = options.protocol === 'wss:';
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
        var opts = {
          rejectUnauthorized: config.rejectUnauthorized,
          host: ip,
          port: port
        };
        if (!socket.disable.servername) {
          opts.servername = util.parseHost(headers.host)[0] || options.hostname;
        }
        isWss && util.setClientCert(opts, clientKey, clientCert, isPfx);
        if (ciphers) {
          opts.ciphers = ciphers;
        }
        reqSocket = (isWss ? tls : net).connect(opts, pipeData);
      } catch (e) {
        return execCallback(e);
      }
      if (retryConnect) {
        abortIfUnavailable(reqSocket);
      } else {
        retryConnect = function(e) {
          if (retryXHost < 2 && (
              (_rules.host && X_RE.test(_rules.host.matcher)) ||
              (isInternalProxy && isXProxy)
            )) {
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
          } else if (isWss && util.checkAuto2Http(socket, ip, proxyUrl)) {
            if (auto2http || util.checkTlsError(e)) {
              options.protocol = null;
              data.httpsTime = data.httpsTime || Date.now();
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
        reqSocket.on('error', function(err) {
          if (retried) {
            return;
          }
          retried = true;
          this.destroy && this.destroy();
          if (destroyed || !retryConnect) {
            return;
          }
          if (!ciphers && isWss && util.isCiphersError(err)) {
            connectServer(hostIp, hostPort, util.getCipher(_rules));
          } else {
            retryConnect();
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
    if (proxyUrl) {
      util.setClientId(headers, socket.enable, socket.disable, clientIp, isInternalProxy);
    } else {
      var clientId = headers[config.CLIENT_ID_HEADER];
      if (clientId) {
        util.removeClientId(headers);
        data.clientId = clientId;
      }
    }
    if (socket.disable.clientIp || socket.disable.clientIP) {
      delete headers[config.CLIENT_IP_HEAD];
    } else {
      var forwardedFor = util.getMatcherValue(_rules.forwardedFor);
      if (net.isIP(forwardedFor)) {
        headers[config.CLIENT_IP_HEAD] = forwardedFor;
      } else if (net.isIP(socket._customXFF)) {
        headers[config.CLIENT_IP_HEAD] = socket._customXFF;
      } else if ((!isInternalProxy && !config.keepXFF && !plugin) || util.isLocalAddress(clientIp)) {
        delete headers[config.CLIENT_IP_HEAD];
      } else {
        headers[config.CLIENT_IP_HEAD] = clientIp;
      }
    }
    reqSocket.write(socket.getBuffer(headers, options.path));
    reqSocket.resume();
    delete headers[config.HTTPS_FIELD];
    var resDelay = util.getMatcherValue(_rules.resDelay);
    if (resDelay > 0) {
      setTimeout(_pipeData, resDelay);
    } else {
      _pipeData();
    }
  }

  function setupSocket(cb) {
    var list = [_rules.reqHeaders, _rules.reqCors, _rules.reqCookies, _rules.params, _rules.urlReplace, _rules.urlParams];
    util.parseRuleJson(list, function(reqHeaders, reqCors, reqCookies, params, urlReplace, urlParams) {
      if (params && urlParams) {
        extend(params, urlParams);
      } else {
        params = params || urlParams;
      }
      var newUrl = params ? util.replaceUrlQueryString(fullUrl, params) : fullUrl;
      newUrl = util.parsePathReplace(newUrl, urlReplace) || newUrl;
      if (newUrl !== fullUrl) {
        fullUrl = newUrl;
        options = util.parseUrl(fullUrl);
        socket._realUrl = newUrl;
      } else {
        options = util.parseUrl(fullUrl);
      }
      data.realUrl = fullUrl;
      var host = headers.host = options.host;
      socket._origin = headers.origin;
      if (reqHeaders) {
        reqHeaders = util.lowerCaseify(reqHeaders, socket.rawHeaderNames);
        socket._customXFF = reqHeaders[config.CLIENT_IP_HEAD];
        delete reqHeaders[config.CLIENT_IP_HEAD];
        extend(headers, reqHeaders);
        headers.host = headers.host || host;
      }
      var reqRuleData = { headers: headers };
      util.setReqCors(reqRuleData, reqCors);
      util.setReqCookies(reqRuleData, reqCookies, headers.cookie);
      if (_rules.referer) {
        headers.referer = util.getMatcherValue(_rules.referer);
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
                  util.setResCors(resRuleData, cors, socket);
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
      reqSocket.pause();
      socket.statusCode = res.statusCode || '';
      socket.resHeaders = res.headers;
      var curResHeaders = reqSocket.headers = res.headers;
      getResRules(socket, res, function() {
        reqSocket.reqId = data.id;
        socket.write(res.getBuffer(curResHeaders));
        if (res.statusCode == 101) {
          socketMgr.handleUpgrade(socket, reqSocket);
        } else {
          reqSocket.resume();
        }
        resData.body = res.body;
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
    return util.onSocketEnd(socket, destroy);
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
}

function addReqInfo(req) {
  var socket = req.socket;
  var remoteData = socket._remoteDataInfo || tunnelTmplData.get(socket.remotePort + ':' + socket.localPort);
  var headers = req.headers;
  headers[config.HTTPS_FIELD] = 1;
  if (remoteData) {
    socket._remoteDataInfo = remoteData;
    headers[config.CLIENT_IP_HEAD] = remoteData.clientIp || LOCALHOST;
    headers[config.CLIENT_PORT_HEAD] = remoteData.clientPort;
    if (remoteData.clientId) {
      headers[config.CLIENT_ID_HEADER] = remoteData.clientId;
    }
    if (remoteData.proxyAuth) {
      headers['proxy-authorization'] = remoteData.proxyAuth;
    }
    if (remoteData.tunnelData) {
      headers[config.TUNNEL_DATA_HEADER] = remoteData.tunnelData;
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
  options.host = config.host || LOCALHOST;
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
    svrRes.once('end', function() {
      var trailers = svrRes.trailers;
      if (!util.isEmptyObject(trailers)) {
        var rawHeaderNames = svrRes.rawTrailers ? getRawHeaderNames(svrRes.rawTrailers) : null;
        try {
          res.addTrailers(formatHeaders(trailers, rawHeaderNames));
        } catch (e) {}
      }
    });
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
  var tunnelData = socket.headers[config.TUNNEL_DATA_HEADER];
  if (tunnelData) {
    statusLine += '\r\n' + config.TEMP_TUNNEL_DATA_HEADER + ': ' + tunnelData;
  }
  return Buffer.concat([Buffer.from(statusLine), chunk]);
}

module.exports = function(socket, next, isWebPort) {
  var reqSocket, reqDestroyed, resDestroyed;
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
  var clientIp = socket.clientIp;
  var clientPort = socket.clientPort;
  util.readOneChunk(socket, function(chunk) {
    headersStr = chunk && chunk.toString();
    if (chunk && CONNECT_RE.test(headersStr)) {
      statusLine = RegExp['$&'];
      chunk = addClientInfo(socket, chunk, statusLine, clientIp, clientPort);
      util.connect({
        port: config.port,
        host: LOCALHOST
      }, function(err, s) {
        reqSocket = s;
        if (err || socket._hasError) {
          return destroy(err);
        }
        reqSocket.write(chunk);
        reqSocket.pipe(socket).pipe(reqSocket);
        abortIfUnavailable(reqSocket);
        socket.resume();
      });
      return;
    }
    if (!chunk) {//没有数据
      return isWebPort ? socket.destroy() : next(chunk);
    }
    if (HTTP_RE.test(headersStr)) {
      statusLine = RegExp['$&'];
      socket.resume();
      server.emit('connection', socket);
      socket.emit('data', addClientInfo(socket, chunk, statusLine, clientIp, clientPort));
    } else if (chunk[0] != 22) {
      next(chunk);
    } else {
      var receiveData, authTimer;
      var useSNI = checkSNI(chunk);
      var domain = useSNI || socket._curHostname;
      if (!domain || (socket.useProxifier && !ca.existsCustomCert(domain))) {
        return next(chunk);
      }
      domain = getDomain(domain);
      var e = socket.enable;
      var d = socket.disable;
      var requestCert = (e.clientCert || e.requestCert) && !d.clientCert && !d.requestCert;
      var key = requestCert ? ':' + domain : domain;
      if (serverAgent.existsServer(key)) {
        useSNI = false;
      }
      var checkTimeout = function() {
        authTimer = setTimeout(function() {
          if (reqSocket) {
            receiveData && reqSocket.removeListener('data', receiveData);
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
          reqSocket = s;
          if (err || socket._hasError) {
            return destroy(err);
          }
          var headers = socket.headers;
          tunnelTmplData.set(reqSocket.localPort + ':' + reqSocket.remotePort, {
            clientIp: clientIp,
            clientPort: clientPort,
            tunnelHost: tunnelHost,
            clientId: headers[config.CLIENT_ID_HEADER],
            proxyAuth:headers['proxy-authorization'],
            tunnelData: headers[config.TUNNEL_DATA_HEADER]
          });
          receiveData = function(data) {
            clearTimeout(authTimer);
            authTimer = null;
            socket.write(data);
            reqSocket.pipe(socket).pipe(reqSocket);
            socket.resume();
          };
          reqSocket.once('data', receiveData);
          reqSocket.write(chunk);
          abortIfUnavailable(reqSocket);
        });
      };
      var useNoSNIServer = function() {
        checkTimeout();
        serverAgent.createServer(key, handlers, handleConnect);
      };
      
      if(useSNI) {
        checkTimeout();
        getSNIServer(h2Handlers, handleConnect, !properties.isEnableHttp2() || util.isDisableH2(socket, true), requestCert);
      } else {
        useNoSNIServer();
      }
    }
  }, isWebPort ? 0 : TIMEOUT);
};
module.exports.setup = function(s, p) {
  server = s;
  proxy = p;
};
module.exports.handleWebsocket = handleWebsocket;


