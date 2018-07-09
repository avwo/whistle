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
var httpsUtil = require('./util');
var parseReq = require('hparser').parse;

var getDomain = httpsUtil.getDomain;
var serverAgent = httpsUtil.serverAgent;
var getSNIServer = httpsUtil.getSNIServer;
var RULE_KEY = 'x-whistle-rule-value';
var HOST_KEY = 'x-whistle-rule-host';
var LOCALHOST = '127.0.0.1';
var tunnelTmplData = new LRU({max: 3000, maxAge: 1000 * 60 * 3});
var TIMEOUT = 5000;
var LOCAL_TIMEOUT = 3000;
var AUTH_TIMEOUT = 3000;
var INTERNAL_PROXY_RE = /^x?internal-proxy:\/\//;
var HS2H_PROXY_RE = /^x?https2http-proxy:\/\//;
var H2HS_PROXY_RE = /^x?http2https-proxy:\/\//;
var SOCKS_PROXY_RE = /^x?socks:\/\//;
var X_PROXY_RE = /^x/;
var proxy;

function handleWebsocket(socket, clientIp, clientPort, callback, wss) {
  var headers = socket.headers;
  if (!wss && headers[config.HTTPS_FIELD]) {
    delete headers[config.HTTPS_FIELD];
    wss = true;
  }
  socket.isHttps = wss;
  socket.fullUrl = util.getFullUrl(socket).replace('http', 'ws');
  socket.rules = rules.initRules(socket);
  util.parseRuleJson(socket.rules.urlParams, function(urlParams) {
    if (urlParams) {
      var _url = util.replaceUrlQueryString(socket.url, urlParams);
      if (socket.url !== _url) {
        socket.url = _url;
        socket.fullUrl = util.getFullUrl(socket).replace('http', 'ws');
        socket.rules = rules.resolveRules(socket.fullUrl);
        if (socket.headerRulesMgr) {
          var _rules = socket.rules;
          socket.rules = socket.headerRulesMgr.resolveRules(socket.fullUrl);
          util.mergeRules(socket, _rules);
        }
      }
    }
    _handleWebsocket(socket, clientIp, clientPort, callback, wss);
  });
}

function _handleWebsocket(socket, clientIp, clientPort, callback, wss) {
  var headers = socket.headers;
  var reqEmitter = new EventEmitter();
  var fullUrl = socket.fullUrl;
  var _rules = socket.rules;
  clientIp = util.removeIPV6Prefix(clientIp || socket.remoteAddress);
  socket.clientIp = clientIp;
  socket.reqId = util.getReqId();
  socket.clientPort = clientPort || socket.remotePort;
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

    var reqSocket, options, pluginRules, matchedUrl, isInternalProxy, done;
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
        socketMgr.handleWebsocket(socket, reqSocket);
      } else {
        if (!status) {
          status = 502;
          body = 'Invalid status code: ' + statusCode;
          resHeaders['Content-Type'] = 'text/html; charset=utf8';
          resHeaders['Content-Length'] = Buffer.byteLength(body);
        }
        resHeaders.Connection = 'close';
        statusMsg = 'HTTP/1.1 ' + status;
      }
      resData.statusCode = status;
      resData.body = body;
      data.requestTime = data.dnsTime =Date.now();
      var rawData = Object.keys(resHeaders).map(function(key) {
        return key + ': ' + resHeaders[key];
      });
      rawData.unshift(statusMsg);
      rawData.push('', body);
      var end = function() {
        data.responseTime = data.endTime = Date.now();
        socket.write(rawData.join('\r\n'));
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
        util.mergeRules(socket, rulesMgr.resolveRules(fullUrl));
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
        data.realUrl = fullUrl = matchedUrl = util.encodeNonAsciiChar(ruleUrlValue);
      }
      rules.getProxy(fullUrl, plugin ? null : socket, function(err, hostIp, hostPort) {
        var proxyUrl = !plugin && _rules.proxy ? _rules.proxy.matcher : null;
        options = util.parseUrl(fullUrl);
        if (proxyUrl) {
          !filter.hide && proxy.emit('request', reqEmitter);
          if (response()) {
            return;
          }
          if (socket.enable.abort || filter.abort) {
            return destroy();
          }
          var isXProxy = X_PROXY_RE.test(proxyUrl);
          var isSocks = SOCKS_PROXY_RE.test(proxyUrl);
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
            proxyOptions.port = parseInt(proxyOptions.port, 10) || (isSocks ? 1080 : 80);
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
              var proxyHeaders = options.headers = { 'user-agent': config.PROXY_UA };
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
              options.proxyAuth = proxyOptions.auth;
            }
            var netMgr = isSocks ? socks : config;
            var reqDelay = util.getMatcherValue(_rules.reqDelay);
            var connectProxy = function() {
              var s = netMgr.connect(options, handleProxy);
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

    function directConnect(hostIp, hostPort) {
      if (typeof hostIp !== 'string') {
        hostIp = null;
      }
      !filter.hide && proxy.emit('request', reqEmitter);
      if (response()) {
        return;
      }
      if (socket.enable.abort || filter.abort) {
        return destroy();
      }
      if (plugin) {
        pluginMgr.loadPlugin(plugin, function(err, ports) {
          if (err) {
            return execCallback(err);
          }

          options.port = ports.port;
          if (!options.port) {
            return execCallback(new Error('No plugin.server'));
          }
          data.realUrl = util.changePort(fullUrl, options.port);
          pluginMgr.addRuleHeaders(socket, _rules);
          options.protocol = 'ws:';
          connectServer();
        });
      } else {
        connectServer(hostIp, hostPort);
      }
    }
    var retryConnect;
    var auto2http;
    function connectServer(hostIp, hostPort) {
      getServerIp(fullUrl, function(ip, port) {
        var isWss = options.protocol === 'wss:';
        socket.hostIp = resData.ip = port ? ip + ':' + port : ip;
        resData.port = port = port || options.port || (isWss ? 443 : 80);
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
            if (isWss && util.checkAuto2Http(socket, ip)) {
              if (auto2http || util.checkTlsError(e)) {
                options.protocol = null;
              } else {
                retryConnect = false;
                auto2http = true;
              }
            }
            connectServer(ip, port);
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

      if (_rules.hostname) {
        headers.host = util.getMatcherValue(_rules.hostname);
      }
      util.parseRuleJson([_rules.reqHeaders, _rules.reqCors, _rules.reqCookies, _rules.params],
      function(reqHeaders, reqCors, reqCookies, params) {
        extend(headers, reqHeaders);
        var reqRuleData = { headers: headers };
        util.setReqCors(reqRuleData, reqCors);
        util.setReqCookies(reqRuleData, reqCookies, headers.cookie);
        if (params) {
          var _url = util.replaceUrlQueryString(fullUrl, params);
          if (fullUrl !== _url) {
            data.realUrl = fullUrl = _url;
            options = util.parseUrl(fullUrl);
          }
        }
        if (socket.disable.clientIp || socket.disable.clientIP
          || util.isLocalAddress(headers[config.CLIENT_IP_HEAD])) {
          delete headers[config.CLIENT_IP_HEAD];
        } else {
          var forwardedFor = util.getMatcherValue(_rules.forwardedFor);
          if (forwardedFor) {
            headers[config.CLIENT_IP_HEAD] = forwardedFor;
          } else if (!config.keepXFF && !_rules.forwardedFor && !plugin) {
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
        reqSocket.write(socket.getBuffer(headers, options.path));
        parseReq(reqSocket, function(err, res) {
          if (err) {
            return execCallback(err);
          }
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
              var responseFor = util.getMatcherValue(_rules.responseFor);
              if (responseFor) {
                headers['x-whistle-response-for'] = responseFor;
              }
              var delResHeaders = util.parseDeleteProperties(socket).resHeaders;
              Object.keys(delResHeaders).forEach(function(name) {
                delete headers[name];
              });
              util.disableResProps(socket, headers);
              socket.write(res.getBuffer(headers));
              reqSocket.reqId = data.id;
              socketMgr.handleWebsocket(socket, reqSocket);
              resData.headers = headers;
              if (res.statusCode != 101) {
                resData.body = res.body;
              }
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

        socket.hostIp = resData.ip = ip;
        data.requestTime = data.dnsTime = Date.now();
        reqEmitter.emit('send', data);
        callback(ip, port);
      };
      if (hostIp) {
        hostHandler(null, hostIp, hostPort);
      } else {
        rules.resolveHost(url, hostHandler, pluginRules, socket.rulesFileMgr, socket.headerRulesMgr);
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
        pluginMgr.getResRules(socket, resData, function() {
          callback(err, _socket);
        });
      } else {
        callback(err, _socket);
      }
    }
  });
}

function handleTlsSocket(socket) {
  var remoteData = tunnelTmplData.get(socket.remotePort) || '';
  var reqSocket;
  var destroyed;
  tunnelTmplData.del(socket.remotePort);
  function destroy(err) {
    if (destroyed) {
      return;
    }
    destroyed = true;
    socket.destroy();
    reqSocket && reqSocket.destroy();
  }

  function abortIfUnavailable(socket) {
    return socket.on('error', destroy).on('close', destroy);
  }

  parseReq(socket, function(err, socket) {
    if (err) {
      return destroy(err);
    }
    //wss
    var clientIp = remoteData.clientIp || LOCALHOST;
    var clientPort = remoteData.clientPort || -1;
    var headers = socket.headers;
    setRuleHeaders(headers, remoteData.rulesHeaders);
    if (headers.upgrade && headers.upgrade.toLowerCase() == 'websocket') {
      handleWebsocket(socket, clientIp, clientPort, function(err, req) {
        if (err) {
          return destroy(err);
        }
        reqSocket = req;
        abortIfUnavailable(reqSocket);
      }, true);
    } else {
      //https
      socket.pause();
      reqSocket = net.connect(config.port, LOCALHOST, function() {
        headers[config.HTTPS_FIELD] = '0';
        headers[config.CLIENT_IP_HEAD] = clientIp;
        headers[config.CLIENT_PORT_HEAD] = clientPort;
        reqSocket.write(socket.getBuffer(headers));
        socket.resume();
        socket.pipe(reqSocket).pipe(socket);
      });
      abortIfUnavailable(reqSocket);
    }
  }, true);
}

function setRuleHeaders(headers, rulesHeaders) {
  if (!rulesHeaders) {
    return;
  }
  var ruleValue = rulesHeaders[RULE_KEY];
  if (ruleValue) {
    var rv = headers[RULE_KEY] || '';
    headers[RULE_KEY] = ruleValue + (rv ? '%0A' + rv : '');
  }

  var hostValue = rulesHeaders[HOST_KEY];
  if (hostValue) {
    var hv = headers[HOST_KEY] || '';
    headers[HOST_KEY] = hostValue + (hv ? '%0A' + hv : '');
  }
}

var CONNECT_RE = /^CONNECT\s+([^\s]+)\s+HTTP\/1.\d$/mi;
var HTTP_RE = /^\w+\s+[^\s]+\s+HTTP\/1.\d$/mi;
var CRLF = util.toBuffer('\r\n');

module.exports = function(socket, hostname, callback, next, isWebPort) {
  var reqSocket, destroyed, timer;
  var rulesHeaders = socket.rulesHeaders;
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
      hostname = RegExp.$1.split(':')[0];
      timer = timeout && setTimeout(request, timeout);
      util.setEstablished(socket);
      return;
    }
    socket.removeListener('data', request);
    socket.removeListener('end', request);
    if (!chunk) {//没有数据
      return isWebPort ? socket.destroy() : next(chunk);
    }
    if (/upgrade\s*:\s*websocket/i.test(headersStr)) { //ws
      parseReq(socket, function(err, socket) {
        if (err) {
          return destroy(err);
        }
        setRuleHeaders(socket.headers, rulesHeaders);
        handleWebsocket(socket, clientIp, socket.remotePort, function(err, req) {
          if (err) {
            return destroy(err);
          }
          abortIfUnavailable(reqSocket = req);
          callback(reqSocket);
        });
      }, chunk, true);
    } else if (HTTP_RE.test(headersStr)) {
      socket.pause();
      reqSocket = net.connect(config.port, LOCALHOST, function() {
        var clientInfo = util.toBuffer(['',
          config.CLIENT_IP_HEAD + ': ' + clientIp,
          config.CLIENT_PORT_HEAD + ': ' + socket.remotePort
        ].join('\r\n'));
        var index = util.indexOfList(chunk, CRLF);
        chunk = Buffer.concat([
          chunk.slice(0, index),
          clientInfo,
          chunk.slice(index)
        ]);
        socket.resume();
        reqSocket.write(chunk);
        reqSocket.pipe(socket).pipe(reqSocket);
      });
      abortIfUnavailable(reqSocket);
      callback(reqSocket);
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
            tunnelTmplData.del(reqSocket.localPort);
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
      var useNoSNIServer = function() {
        checkTimeout();
        serverAgent.createServer(domain, handleTlsSocket, handleConnect);
      };
      var handleConnect = function(port) {
        reqSocket = net.connect(port, LOCALHOST, function() {
          tunnelTmplData.set(reqSocket.localPort, {
            clientIp: clientIp,
            clientPort: socket.remotePort,
            rulesHeaders: rulesHeaders
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
        });
        abortIfUnavailable(reqSocket);
        callback(reqSocket);
      };
      if(useSNI) {
        checkTimeout();
        getSNIServer(handleTlsSocket, handleConnect);
      } else {
        useNoSNIServer();
      }
    }
  }
};
module.exports.setup = function(_proxy) {
  proxy = _proxy;
};
module.exports.handleWebsocket = handleWebsocket;


