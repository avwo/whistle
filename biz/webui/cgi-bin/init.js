var getRules = require('./rules');
var getValues = require('./values');
var util = require('./util');
var config = require('../lib/config');
var properties = require('../lib/properties');
var proxy = require('../lib/proxy');

var logger = proxy.logger;
var pluginMgr = proxy.pluginMgr;

module.exports = function(req, res) {
  var lastLog = proxy.getLogs(0, 1)[0];
  var lastSvrLog = logger.getLogs(0, 1)[0];

  res.json({
    version: config.version,
    lastLogId: lastLog && lastLog.id,
    lastSvrLogId: lastSvrLog && lastSvrLog.id,
    lastDataId: proxy.getLastDataId(),
    clientId: util.getClientId(),
    clientIp: util.getClientIp(req),
    mrulesClientId: config.mrulesClientId,
    mrulesTime: config.mrulesTime,
    mvaluesClientId: config.mvaluesClientId,
    mvaluesTime: config.mvaluesTime,
    latestVersion: properties.get('latestVersion'),
    server: util.getServerInfo(req),
    rules: getRules(),
    values: getValues(),
    interceptHttpsConnects: properties.get('interceptHttpsConnects'),
    plugins: pluginMgr.getPlugins(),
    disabledAllRules: properties.get('disabledAllRules'),
    disabledPlugins: properties.get('disabledPlugins') || {},
    disabledPluginsRules: properties.get('disabledPluginsRules') || {},
    disabledAllPlugins: properties.get('disabledAllPlugins'),
    localUIHost: config.localUIHost
  });
};
