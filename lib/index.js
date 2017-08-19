var express = require('express');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var logger = require('./util/logger');
var rules = require('./rules');
var httpsUtil = require('./https/util');
var rulesUtil = require('./rules/util');
var initDataServer = require('./util/data-server');
var initLogServer = require('./util/log-server');
var pluginMgr = require('./plugins');
var config = require('./config');
var loadService = require('./service');
var tunnelProxy = require('./tunnel');

function proxy(callback) {
  var app = express();
  var server = app.listen(config.port, callback);
  var proxyEvents = new EventEmitter();
  var middlewares = ['./init', '../biz']
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
