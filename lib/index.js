var express = require('express');
var path = require('path');
var fs = require('fs');
var http = require('http');
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

function proxy(callback) {
  var app = express();
  var server = http.createServer();
  var proxyEvents = new EventEmitter();
  var middlewares = ['./init', '../biz']
    .concat(require('./inspectors'))
    .concat(config.middlewares)
    .concat(require('./handlers'));
  server.timeout = server.keepAliveTimeout = config.idleTimeout;
  proxyEvents.config = config;
  proxyEvents.server = server;
  app.logger = logger;
  middlewares.forEach(function(mw) {
    mw && app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
  });
  server.on('clientError', function(err, socket) {
    if (!socket.writable) {
      return socket.destroy(err);
    }
    var stack = util.getErrorStack('clientError: Bad request');
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n' + stack);
  });
  initSocketMgr(proxyEvents);
  setupHttps(server, proxyEvents);
  exportInterfaces(proxyEvents);
  tunnelProxy(server, proxyEvents);
  upgradeProxy(server);
  initDataServer(proxyEvents);
  initLogServer(proxyEvents);
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
  if (config.host) {
    server.listen(config.port, config.host, execCallback);
  } else {
    server.listen(config.port, execCallback);
  }
  require('../biz/init')(proxyEvents, function(){
    server.on('request', app);
    execCallback();
  });
  pluginMgr.initProxy(proxyEvents);
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
  obj.socketMgr = initSocketMgr;
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
