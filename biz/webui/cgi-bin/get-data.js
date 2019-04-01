var proxy = require('../lib/proxy');
var util = require('./util');
var config = require('../../../lib/config');
var rulesUtil = require('../../../lib/rules/util');

var properties = rulesUtil.properties;
var rules = rulesUtil.rules;
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
  var stopRecordConsole = data.startLogTime == -3;
  var stopRecordSvrLog = data.startSvrLogTime == -3;
  res.json({
    ec: 0,
    version: config.version,
    clientIp: clientIp,
    mrulesClientId: config.mrulesClientId,
    mrulesTime: config.mrulesTime,
    mvaluesClientId: config.mvaluesClientId,
    mvaluesTime: config.mvaluesTime,
    server: util.getServerInfo(req),
    lastLogId: stopRecordConsole ? proxy.getLatestId() : undefined,
    lastSvrLogId: stopRecordSvrLog ? logger.getLatestId() : undefined,
    log: stopRecordConsole ? [] : proxy.getLogs(data.startLogTime, data.count, data.logId),
    svrLog: stopRecordSvrLog ? [] : logger.getLogs(data.startSvrLogTime, data.count),
    plugins: pluginMgr.getPlugins(),
    disabledPlugins: properties.get('disabledPlugins') || {},
    disabledPluginsRules: properties.get('disabledPluginsRules') || {},
    allowMultipleChoice: properties.get('allowMultipleChoice'),
    disabledAllPlugins: properties.get('disabledAllPlugins'),
    disabledAllRules: properties.get('disabledAllRules'),
    interceptHttpsConnects: !config.multiEnv && properties.get('interceptHttpsConnects'),
    defaultRulesIsDisabled: rules.defaultRulesIsDisabled(),
    list: rules.getSelectedList(),
    data: proxy.getData(data, clientIp)
  });
};
