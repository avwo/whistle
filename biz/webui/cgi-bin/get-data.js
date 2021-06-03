var proxy = require('../lib/proxy');
var util = require('./util');
var config = require('../../../lib/config');
var rulesUtil = require('../../../lib/rules/util');
var ca = require('../../../lib/https/ca');

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
  var h = req.headers;
  util.sendGzip(req, res, {
    ec: 0,
    version: config.version,
    custom1: properties.get('Custom1'),
    custom2: properties.get('Custom2'),
    supportH2: config.enableH2,
    hasInvalidCerts: ca.hasInvalidCerts,
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
    disabledPlugins: !config.notAllowedDisablePlugins && properties.get('disabledPlugins') || {},
    allowMultipleChoice: properties.get('allowMultipleChoice'),
    disabledAllPlugins: !config.notAllowedDisablePlugins && properties.get('disabledAllPlugins'),
    disabledAllRules: !config.notAllowedDisableRules && properties.get('disabledAllRules'),
    interceptHttpsConnects: properties.isEnableCapture(),
    enableHttp2: properties.isEnableHttp2(),
    defaultRulesIsDisabled: rules.defaultRulesIsDisabled(),
    list: rules.getSelectedList(),
    data: proxy.getData(data, clientIp, h['x-whistle-filter-key'], h['x-whistle-filter-value'], h['x-whistle-filter-client-id'], h[config.CLIENT_ID_HEADER])
  });
};
