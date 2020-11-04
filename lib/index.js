var express = require('express');
var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var socks = require('sockx');
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var logger = require('./util/logger');
var rules = require('./rules');
var setupHttps = require('./https').setup;
var httpsUtil = require('./https/ca');
var rulesUtil = require('./rules/util');
var initDataServer = require('./util/data-server');
var initLogServer = require('./util/log-server');
var pluginMgr = require('./plugins');
var config = require('./config');
var loadService = require('./service');
var initSocketMgr = require('./socket-mgr');
var tunnelProxy = require('./tunnel');
var upgradeProxy = require('./upgrade');

function handleClientError(err, socket) {
  if (!socket.writable) {
    return socket.destroy(err);
  }
  var errCode = err && err.code;
  var statusCode = errCode === 'HPE_HEADER_OVERFLOW' ? 431 : 400;
  var stack = util.getErrorStack('clientError: Bad request' + (errCode ? ' (' + errCode + ')' : ''));
  socket.end('HTTP/1.1 ' + statusCode + ' Bad Request\r\n\r\n' + stack);
}

function proxy(callback) {
  var app = express();
  var server = http.createServer();
  var proxyEvents = new EventEmitter();
  var middlewares = ['./init', '../biz']
    .concat(require('./inspectors'))
    .concat(config.middlewares)
    .concat(require('./handlers'));
  server.timeout = config.timeout;
  proxyEvents.config = config;
  proxyEvents.server = server;
  app.disable('x-powered-by');
  app.logger = logger;
  middlewares.forEach(function(mw) {
    mw && app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
  });
  server.on('clientError', handleClientError);
  initSocketMgr(proxyEvents);
  setupHttps(server, proxyEvents);
  exportInterfaces(proxyEvents);
  tunnelProxy(server, proxyEvents);
  upgradeProxy(server);
  initDataServer(proxyEvents);
  initLogServer(proxyEvents);
  rulesUtil.setup(proxyEvents);
  var properties = rulesUtil.properties;
  if (config.disableAllRules) {
    properties.set('disabledAllRules', true);
  } else if (config.disableAllRules === false) {
    properties.set('disabledAllRules', false);
  }
  if (config.disableAllPlugins) {
    properties.set('disabledAllPlugins', true);
  } else if (config.disableAllPlugins === false) {
    properties.set('disabledAllPlugins', false);
  }
  if (config.allowMultipleChoice) {
    properties.set('allowMultipleChoice', true);
  } else if (config.allowMultipleChoice === false) {
    properties.set('allowMultipleChoice', false);
  }
  rulesUtil.addValues(config.values, config.replaceExistValue);
  rulesUtil.addRules(config.rules, config.replaceExistRule);
  config.debug && rules.disableDnsCache();
  var count = 2;
  var execCallback = function() {
    if (--count === 0 && typeof callback === 'function') {
      callback.call(server, proxyEvents);
    }
  };
  util.getBoundIp(function(host) {
    util.checkPort(!config.INADDR_ANY && !host && config.port, function() {
      server.listen(config.port, host, execCallback);
    });
  });
  var createNormalServer = function(port, httpModule, opts) {
    if (!port) {
      return;
    }
    ++count;
    var optionServer = httpModule.createServer(opts);
    var isHttps = !!opts;
    proxyEvents[opts ? 'httpsServer' : 'httpServer'] = optionServer;
    optionServer.on('request', function(req, res) {
      req.isHttps = isHttps;
      app.handle(req, res);
    });
    optionServer.isHttps = isHttps;
    tunnelProxy(optionServer, proxyEvents);
    upgradeProxy(optionServer);
    optionServer.on('clientError', handleClientError);
    util.getBoundIp(function(host) {
      util.checkPort(!config.INADDR_ANY && !host && port, function() {
        optionServer.listen(port, host, execCallback);
      });
    });
  };
  createNormalServer(config.httpPort, http);
  createNormalServer(config.httpsPort, https, httpsUtil.SNI_OPTIONS);
  if (config.socksPort) {
    ++count;
    var boundHost;
    var socksServer = socks.createServer(function(info, accept, deny) {
      var dstPort = info.dstPort;
      var dstAddr = info.dstAddr;
      var connPath = dstAddr + ':' + dstPort;
      var headers = { host: connPath };
      headers['x-whistle-server'] = 'socks';
      if (config.socksMode || (dstPort != 80 && dstPort != 443 &&
        (dstPort != config.port || !util.isLocalAddress(dstAddr) &&
        !config.isLocalUIUrl(dstAddr)))) {
        headers['x-whistle-policy'] = 'tunnel';
      }
      var client = http.request({
        method: 'CONNECT',
        agent: false,
        path: connPath,
        host: boundHost,
        port: config.port,
        headers: headers
      });
      var destroy = function() {
        if (client) {
          client.abort();
          client = null;
          deny();
        }
      };
      client.on('error', destroy);
      client.on('connect', function(res, socket) {
        socket.on('error', destroy);
        if (res.statusCode != 200) {
          return destroy();
        }
        var reqSock = accept(true);
        if (reqSock) {
          reqSock.pipe(socket).pipe(reqSock);
        } else {
          destroy();
        }
      });
      client.end();
    });
    proxyEvents.socksServer = socksServer;
    util.getBoundIp(function(host) {
      boundHost = host || '127.0.0.1';
      util.checkPort(!config.INADDR_ANY && !host && config.socksPort, function() {
        socksServer.listen(config.socksPort, host, execCallback);
      });
      socksServer.useAuth(socks.auth.None());
    });
  }
  require('../biz/init')(proxyEvents, function(){
    server.on('request', app);
    execCallback();
  });
  return proxyEvents;
}

function exportInterfaces(obj) {
  obj.rules = rules;
  obj.util = util;
  obj.rulesUtil = rulesUtil;
  obj.httpsUtil = httpsUtil;
  obj.pluginMgr = pluginMgr;
  obj.logger = logger;
  obj.loadService = loadService;
  obj.setAuth = config.setAuth;
  obj.setUIHost = config.setUIHost;
  obj.setPluginUIHost = config.setPluginUIHost;
  obj.socketMgr = initSocketMgr;
  return obj;
}

process.on('uncaughtException', function(err){
  var code = err && err.code;
  if (code === 'EPIPE' || code === 'ERR_HTTP2_ERROR') {
    return;
  }
  if (!err || code !== 'ERR_IPC_CHANNEL_CLOSED') {
    var stack = util.getErrorStack(err);
    fs.writeFileSync(path.join(process.cwd(), config.name + '.log'), '\r\n' + stack + '\r\n', {flag: 'a'});
    /*eslint no-console: "off"*/
    console.error(stack);
  }
  process.exit(1);
});

module.exports = exportInterfaces(proxy);
