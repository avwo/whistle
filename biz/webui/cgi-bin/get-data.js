var proxy = require('../lib/proxy');
var util = require('./util');
var config = require('../lib/config');
var properties = require('../lib/properties');
var rules = require('../lib/rules');

var pluginMgr = proxy.pluginMgr;
var logger = proxy.logger;

module.exports = function(req, res) {
  var data = req.query;
  if (data.ids && typeof data.ids == 'string') {
    data.ids = data.ids.split(',');
  } else {
    data.ids = null;
  }
  var clientIp = util.getClientIp(req);
  res.json({
    ec: 0,
    version: config.version,
    clientIp: clientIp,
    mrulesClientId: config.mrulesClientId,
    mrulesTime: config.mrulesTime,
    mvaluesClientId: config.mvaluesClientId,
    mvaluesTime: config.mvaluesTime,
    server: util.getServerInfo(req),
    log: proxy.getLogs(data.startLogTime, data.count, data.logId),
    svrLog: logger.getLogs(data.startSvrLogTime, data.count),
    plugins: pluginMgr.getPlugins(),
    disabledPlugins: properties.get('disabledPlugins') || {},
    disabledPluginsRules: properties.get('disabledPluginsRules') || {},
    allowMultipleChoice: properties.get('allowMultipleChoice'),
    disabledAllPlugins: properties.get('disabledAllPlugins'),
    disabledAllRules: properties.get('disabledAllRules'),
    interceptHttpsConnects: properties.get('interceptHttpsConnects'),
    defaultRulesIsDisabled: rules.defaultRulesIsDisabled(),
    list: rules.getSelectedList(),
    data: proxy.getData(data, clientIp)
  });
};
