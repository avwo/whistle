var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var tls = require('tls');
var fs = require('fs');
var socks = require('socksv5');
var EventEmitter = require('events').EventEmitter;
var extend = require('util')._extend;
var util = require('./util');
var logger = require('./util/logger');
var rules = require('./rules');
var dispatch = require('./https');
var httpsUtil = require('./https/util');
var rulesUtil = require('./rules/util');
var initDataServer = require('./util/data-server');
var initLogServer = require('./util/log-server');
var pluginMgr = require('./plugins');
var config = require('./config');
var LOCALHOST = '127.0.0.1';
var WHISTLE_POLICY_HEADER = 'x-whistle-policy';
var TUNNEL_HOST_RE = /^[^:\/]+\.[^:\/]+:\d+$/;
var index = 0;


function tunnelProxy(server, proxy) {
//see: https://github.com/joyent/node/issues/9272
  if (typeof tls.checkServerIdentity == 'function') {
    var checkServerIdentity = tls.checkServerIdentity;
    tls.checkServerIdentity = function() {
      try {
        return checkServerIdentity.apply(this, arguments);
      } catch(err) {
        logger.error(err);
        return err;
      }
    };
  }

  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
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
    var resSocket, proxySocket, responsed, reqEmitter, rulesMgr;
    req.isTunnel = true;
    req.clientIp = util.getClientIp(req) || LOCALHOST;
    req.reqId = ++index;
    var hostname = options.hostname;
    var useTunnelPolicy = req.headers[WHISTLE_POLICY_HEADER] == 'tunnel';
    var isLocalUIUrl = !useTunnelPolicy && (config.isLocalUIUrl(hostname) || config.isPluginUrl(hostname));
    var _rules = req.rules = isLocalUIUrl ? {} : rules.resolveRules(tunnelUrl);
    rules.resolveFileRules(req, function() {
      var plugin = pluginMgr.resolveWhistlePlugins(req);
      pluginMgr.getTunnelRules(req, function(_rulesMgr) {
        if (_rulesMgr) {
          rulesMgr = _rulesMgr;
          util.mergeRules(req, rulesMgr.resolveRules(tunnelUrl));
          plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
        }
        var filter = req.filter;
        var disable = req.disable;
        reqEmitter = new EventEmitter();
        var headers = req.headers;
        var reqData = {
          ip: req.clientIp,
          method: util.toUpperCase(req.method) || 'CONNECT',
          httpVersion: req.httpVersion || '1.1',
          headers: headers
        };
        var resData = {headers: {}};
        var data = reqEmitter.data = {
          url: options.host,
          startTime: Date.now(),
          rules: _rules,
          req: reqData,
          res: resData,
          isHttps: true
        };
        abortIfUnavailable(reqSocket);
        if (!rulesUtil.properties.get('hideHttpsConnects') && !filter.hide) {
          proxy.emit('request', reqEmitter);
        }
        if (disable.tunnel) {
          return reqSocket.destroy();
        }
        
        if (!useTunnelPolicy && (isLocalUIUrl || ((filter.https || filter.tunnel
            || rulesUtil.properties.get('interceptHttpsConnects')) && !filter.intercept && !disable.intercept))) {
          dispatch(reqSocket, hostname, proxy, data, function(_resSocket) {
            resSocket = _resSocket;
          });
          sendEstablished(true);
          return;
        }
  
        if (filter.rule) {
          delete _rules.rule;
          plugin = null;
        }
        
        var tunnelPort, proxyUrl;
        if(plugin) {
          tunnelPort = plugin.ports && plugin.ports.tunnelPort;
          if (!tunnelPort) {
            return emitError(new Error('No plugin.tunnelServer'));
          }
          proxyUrl = 'proxy://127.0.0.1:' + tunnelPort;
        }
        
        var realUrl = _rules.rule && _rules.rule.url.replace('https:', 'tunnel:');
        if (/^tunnel:\/\//.test(realUrl) && realUrl != tunnelUrl) {
          tunnelUrl = realUrl;
          data.realUrl = realUrl.replace('tunnel://', '');
          parseUrl();
        }
        
        rules.getProxy(tunnelUrl, tunnelPort || proxyUrl ? null : req, function() {
          if (!proxyUrl) {
            proxyUrl = !tunnelPort && _rules.proxy ? _rules.proxy.matcher : null;
          }
          
          if (proxyUrl) {
            var isSocks = /^socks:\/\//.test(proxyUrl);
            var _url = 'http:' + util.removeProtocol(proxyUrl);
            data.proxy = true;
            resolveHost(_url, function(ip) {
              options = parseUrl(_url, isSocks ? 1080 : 80);
              if (options.port == config.port && util.isLocalAddress(ip)) {
                return emitError(new Error('Can not proxy to itself'));
              }
              var onConnect = function(_proxySocket) {
                proxySocket = _proxySocket;
                abortIfUnavailable(proxySocket);
                reqSocket.pipe(proxySocket).pipe(reqSocket);
                sendEstablished();
              };
              var dstOptions = url.parse(tunnelUrl);
              dstOptions.proxyHost = ip;
              dstOptions.proxyPort = parseInt(options.port, 10);
              dstOptions.port = dstOptions.port || 443;
              dstOptions.host = dstOptions.hostname;
              var _headers = extend({}, headers);
              if (req.clientIp) {
                _headers[pluginMgr.CLIENT_IP_HEADER] = req.clientIp;
              }
              var ruleValue = tunnelPort && util.getMatcherValue(_rules.rule);
              if (ruleValue) {
                _headers[pluginMgr.RULE_VALUE_HEADER] = encodeURIComponent(ruleValue);
              }
              _headers.host = dstOptions.hostname + ':' + (dstOptions.port || 443);
              dstOptions.headers = _headers;
              if (isSocks) {
                dstOptions.proxyPort = options.port || 1080;
                dstOptions.localDNS = false;
                dstOptions.auths = config.getAuths(options);
                socks.connect(dstOptions, onConnect).on('error', emitError);
              } else {
                dstOptions.proxyPort = options.port || 80;
                dstOptions.proxyAuth = options.auth;
                config.connect(dstOptions, onConnect).on('error', emitError);
              }
            });
          } else {
            tunnel();
          }
        });
        
        function tunnel() {
          resolveHost(tunnelUrl, function(ip, port) {
            resData.ip = port ? ip + ':' + port : ip;
            resSocket = net.connect(port || options.port, ip, function() {
              resSocket.pipe(reqSocket).pipe(resSocket);
              sendEstablished();
            });
            abortIfUnavailable(resSocket);
          });
        }

        function resolveHost(url, callback) {
          rules.resolveHost(url, function(err, ip, port, host) {
            if (host) {
              _rules.host = host;
            }
            data.requestTime = data.dnsTime = Date.now();
            resData.ip = ip || LOCALHOST;
            reqEmitter.emit('send', data);
            err ? emitError(err) : callback(ip, port);
          }, rulesMgr);
        }

        function abortIfUnavailable(socket) {
          socket.on('error', emitError).on('close', emitError);
        }

        function sendEstablished(dispatch) {
          reqSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n');
          if (!dispatch) {
            responsed = true;
            if (reqEmitter) {
              data.responseTime = data.endTime = Date.now();
              resData.statusCode = 200;
              reqEmitter.emit('response', data);
              reqEmitter.emit('end', data);
            }
          }
          return reqSocket;
        }

        function emitError(err) {
          if (responsed) {
            return;
          }
          responsed = true;
          resSocket && resSocket.destroy();
          proxySocket && proxySocket.destroy();
          reqSocket.destroy();
          data.responseTime = data.endTime = Date.now();

          if (!resData.ip) {
            resData.ip = LOCALHOST;
          }

          if (err) {
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
        }
      });
    });
  });

  return server;
}

function proxy(callback) {
  var app = express();
  var server = app.listen(config.port, callback);
  var proxyEvents = new EventEmitter();
  var middlewares = ['./init',
'../biz']
.concat(require('./inspectors'))
.concat(config.middlewares)
.concat(require('./handlers'));

  proxyEvents.config = config;
  app.logger = logger;
  middlewares.forEach(function(mw) {
    mw && app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
  });

  exportInterfaces(proxyEvents);
  tunnelProxy(server, proxyEvents);
  initDataServer(proxyEvents);
  initLogServer(proxyEvents);
  require('../biz/init')(proxyEvents);
  config.debug && rules.disableDnsCache();
  config.rules && rulesUtil.parseRules(config.rules);
  if (config.values) {
    Object.keys(config.values).forEach(function(name) {
      rulesUtil.values.add(name, config.values[name]);
    });
  }
  return proxyEvents;
}

function exportInterfaces(obj) {
  obj.rules = rules;
  obj.util = util;
  obj.rulesUtil = rulesUtil;
  obj.httpsUtil = httpsUtil;
  obj.pluginMgr = pluginMgr;
  obj.logger = logger;
  return obj;
}

process.on('uncaughtException', function(err){
  var stack = util.getErrorStack(err);
  fs.writeFileSync(path.join(process.cwd(), config.name + '.log'), '\r\n' + stack + '\r\n', {flag: 'a'});
  /*eslint no-console: "off"*/
  console.error(stack);
  process.exit(1);
});

module.exports = exportInterfaces(proxy);
