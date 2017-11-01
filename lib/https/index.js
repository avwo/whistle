var net = require('net');
var tls = require('tls');
var url = require('url');
var socks = require('socksv5');
var EventEmitter = require('events').EventEmitter;
var util = require('../util');
var extend = require('util')._extend;
var config = require('../config');
var rules = require('../rules');
var pluginMgr = require('../plugins');
var socketMgr = require('../socket-mgr');
var serverAgent = require('./util').serverAgent;
var logger = require('../util/logger');
var LOCALHOST = '127.0.0.1';
var tunnelTmplData = {};
var proxy;

function handleWebsocket(socket, clientIp, clientPort, callback, wss) {
  var headers = socket.headers;
  if (!wss && headers[config.HTTPS_FIELD]) {
    delete headers[config.HTTPS_FIELD];
    wss = true;
  }
  socket.isHttps = wss;
  var reqEmitter = new EventEmitter();
  var fullUrl = socket.fullUrl = util.getFullUrl(socket).replace('http', 'ws');
  var _rules = rules.initRules(socket);
  rules.resolveRulesFile(socket, function() {
    var filter = socket.filter;
    var now = Date.now();
    var reqData = {
      ip: util.removeIPV6Prefix(clientIp || socket.remoteAddress),
      port: clientPort || socket.remotePort,
      method: 'GET',
      httpVersion: socket.httpVersion || '1.1',
      headers: headers,
      rawHeaderNames: socket.rawHeaderNames
    };
    var resData = {};
    var data = reqEmitter.data = {
      url: fullUrl,
      startTime: now,
      rules: _rules,
      req: reqData,
      res: resData,
      rulesHeaders: socket.rulesHeaders
    };
    socket.clientIp = reqData.ip;
    socket.reqId = data.id = util.getReqId();

    var reqSocket, options, pluginRules, matchedUrl, isInternalProxy, done;
    var timeout = util.setTimeout(function() {
      destroy(new Error('Timeout'));
    });

    var plugin = pluginMgr.resolveWhistlePlugins(socket);
    pluginMgr.getRules(socket, function(rulesMgr) {
      if (pluginRules = rulesMgr) {
        util.mergeRules(socket, rulesMgr && rulesMgr.resolveRules(fullUrl));
        if (filter.rule) {
          plugin = null;
        } else {
          plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
        }
      }

      var ruleUrlValue = plugin ? null : util.rule.getUrl(_rules.rule);
      if (ruleUrlValue && /^wss?:\/\//.test(ruleUrlValue) && fullUrl != ruleUrlValue) {
        data.realUrl = fullUrl = matchedUrl = ruleUrlValue;
      }
      rules.getProxy(fullUrl, plugin ? null : socket, function(err, hostIp, hostPort) {
        var proxyUrl = !plugin && _rules.proxy ? _rules.proxy.matcher : null;
        if (proxyUrl) {
          !filter.hide && proxy.emit('request', reqEmitter);
          if (socket.enable.abort || filter.abort) {
            return destroy();
          }
          var isSocks = /^socks:\/\//.test(proxyUrl);
          isInternalProxy = /^internal-proxy:\/\//.test(proxyUrl);
          var isHttps2HttpProxy = isInternalProxy || /^https2http-proxy:\/\//.test(proxyUrl);
          if (!isHttps2HttpProxy && !wss && /^http2https-proxy:\/\//.test(proxyUrl)) {
            wss = true;
          }
          proxyUrl = 'http:' + util.removeProtocol(proxyUrl);
          resolveHost(proxyUrl, function(ip) {
            options = url.parse(proxyUrl);
            options.port = parseInt(options.port, 10) || (isSocks ? 1080 : 80);
            var isProxyPort = options.port == config.port;
            if (isProxyPort && util.isLocalAddress(ip)) {
              return execCallback(new Error('Unable to proxy to itself (' + ip + ':' + config.port + ')'));
            }

            var dstOptions = url.parse(fullUrl);
            dstOptions.proxyHost = ip;
            resData.port = dstOptions.proxyPort = options.port;
            dstOptions.host = dstOptions.hostname;
            if (!dstOptions.port) {
              dstOptions.port = wss ? 443 : 80;
            }

            var onConnect = function(proxySocket) {
              if (wss) {
                proxySocket = tls.connect({
                  rejectUnauthorized: false,
                  socket: proxySocket,
                  servername: dstOptions.hostname
                }).on('error', execCallback);
              }

              reqSocket = proxySocket;
              abortIfUnavailable(reqSocket);
              pipeData();
            };
            if (isSocks) {
              dstOptions.localDNS = false;
              dstOptions.auths = config.getAuths(options);
              socks.connect(dstOptions, onConnect).on('error', execCallback);
            } else {
              var proxyHeaders = dstOptions.headers = dstOptions.headers || {};
              if (!util.isLocalIp(socket.clientIp)) {
                proxyHeaders[config.CLIENT_IP_HEAD] = socket.clientIp;
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
              dstOptions.proxyAuth = options.auth;
              config.connect(dstOptions, onConnect).on('error', execCallback);
            }
          });
        } else {
          connect(hostIp, hostPort);
        }
      });
    });

    function connect(hostIp, hostPort) {
      options = url.parse(fullUrl);
      !filter.hide && proxy.emit('request', reqEmitter);
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
          _connect();
        });
      } else {
        _connect(hostIp, hostPort);
      }
    }

    function _connect(hostIp, hostPort) {
      resolveHost(fullUrl, function(ip, port) {
        var isWss = options.protocol == 'wss:';
        resData.ip = port ? ip + ':' + port : ip;
        resData.port = port = port || options.port || (isWss ? 443 : 80);
        reqSocket = (isWss ? tls : net).connect({
          rejectUnauthorized: false,
          host: ip,
          port: port
        }, pipeData);
        abortIfUnavailable(reqSocket);
      }, hostIp, hostPort);
    }

    function pipeData() {
      clearTimeout(timeout);
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

      var reqHeaders = util.parseReqHeaders(_rules.reqHeaders);
      extend(headers, reqHeaders);
      reqSocket.write(socket.getBuffer((isInternalProxy || reqHeaders
        || plugin || matchedUrl || _rules.hostname || util.hasHeaderRules(headers)) ? headers : null,
          matchedUrl ? options.path : null));
      util.parseReq(reqSocket, function(err, res) {
        if (err) {
          return execCallback(err);
        }

        headers = res.headers;
        if (matchedUrl) {
          headers['access-control-allow-origin'] = origin;
        }
        socket.write(res.getBuffer(matchedUrl ? headers : null));
        reqSocket.reqId = data.id;
        socketMgr.handleWebsocket(reqSocket, socket);
        resData.headers = headers;
        if (res.statusCode != 101) {
          resData.body = res.body;
        }
        resData.rawHeaderNames = res.rawHeaderNames;
        resData.statusCode = res.statusCode;
        reqEmitter.emit('response', data);
        execCallback(null, reqSocket);
      }, true);
    }

    function resolveHost(url, callback, hostIp, hostPort) {
      data.status = 'requestEnd';
      pluginMgr.postStatus(socket, data);
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

        resData.ip = ip;
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
      err && logger.error(fullUrl + '\n' + err.stack);
    }

    function execCallback(err, _socket) {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timeout);
      data.responseTime = data.endTime = Date.now();
      resData.ip = resData.ip || LOCALHOST;
      var status;
      if (!err && !_socket) {
        err = new Error('Aborted');
        data.reqError = true;
        resData.statusCode ='aborted';
        reqData.body = util.getErrorStack(err);
        reqEmitter.emit('abort', data);
        status = 'aborted';
      } else if (err) {
        data.resError = true;
        resData.statusCode = resData.statusCode || 502;
        resData.body = util.getErrorStack(err);
        util.emitError(reqEmitter, data);
        status = 'error';
      } else {
        reqEmitter.emit('end', data);
        status = 'responseEnd';
      }

      callback(err, _socket);
      data.status = status;
      pluginMgr.postStatus(socket, data);
    }
  });
}

function handleTlsSocket(socket) {
  var reqSocket;
  var destroyed;
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

  util.parseReq(socket, function(err, socket) {
    if (err) {
      return destroy(err);
    }
    //wss
    var remoteData = tunnelTmplData[socket.remotePort] || {};
    var clientIp = remoteData.clientIp || LOCALHOST;
    var clientPort = remoteData.clientPort || -1;
    delete tunnelTmplData[socket.remotePort];
    var headers = socket.headers;
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

module.exports = function dispatch(socket, hostname, callback) {
  var reqSocket;
  var destroyed;
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

  function request(chunk) {
    socket.removeListener('data', request);
    socket.removeListener('end', request);
    if (!chunk) {//没有数据
      return destroy();
    }

    if (/upgrade\s*:\s*websocket/i.test(chunk.toString())) { //ws
      util.parseReq(socket, function(err, socket) {
        if (err) {
          return destroy(err);
        }
        handleWebsocket(socket, socket.clientIp, socket.remotePort, function(err, req) {
          if (err) {
            return destroy(err);
          }
          abortIfUnavailable(reqSocket = req);
          callback(reqSocket);
        });
      }, chunk, true);
    } else {
      serverAgent.createServer(hostname, handleTlsSocket, function(port) {
        reqSocket = net.connect(port, LOCALHOST, function() {
          tunnelTmplData[reqSocket.localPort] = {
            clientIp: socket.clientIp,
            clientPort: socket.remotePort
          };
          reqSocket.write(chunk);
          reqSocket.pipe(socket).pipe(reqSocket);
        });
        abortIfUnavailable(reqSocket);
        callback(reqSocket);
      });
    }
  }
};
module.exports.setup = function(_proxy) {
  proxy = _proxy;
};
module.exports.handleWebsocket = handleWebsocket;


