var util = require('../../../lib/util');
var config = require('../../../lib/config');
var proc = require('../../../lib/util/process');
var rulesUtil = require('../../../lib/rules/util');
var padLeft = require('../../../lib/util/common').padLeft;

var properties = rulesUtil.properties;
var rules = rulesUtil.rules;
var PID = process.pid;
var MAX_OBJECT_SIZE = 1024 * 1024 * 6;
var index = 0;
var dnsOverHttps = config.dnsOverHttps;
var doh = !!dnsOverHttps;

exports.getClientId = function() {
  if (index > 9999) {
    index = 0;
  }
  return Date.now() + '-' + index++;
};

exports.getServerInfo = function(req) {
  var baseDir;
  if (!config.networkMode && !config.pluginsMode) {
    baseDir = config.baseDirHash;
  }
  var info = {
    whistleId: config.whistleId,
    hasUpdater: config.hasUpdater,
    pid: PID,
    pInfo: proc,
    verbatim: config.verbatim,
    dnsOrder: config.dnsOrder,
    ipv6Only: config.ipv6Only,
    dcc: config.disableCustomCerts,
    dns: dnsOverHttps || config.dnsServer,
    rulesMFlag: rules.getMFlag(),
    doh: doh,
    bip: config.host,
    df: config.dnsOptional,
    r6: config.resolve6,
    version: config.version,
    cmdName: config.cmdName,
    hideLeftMenu: config.hideLeftMenu,
    networkMode: config.networkMode,
    rulesOnlyMode: config.rulesOnlyMode,
    pluginsMode: config.pluginsMode,
    ndr: config.notAllowedDisableRules,
    ndp: config.notAllowedDisablePlugins,
    drb: config.disabledBackOption,
    drm: config.disabledMultipleOption,
    rulesMode: config.rulesMode,
    strictMode: config.strict,
    multiEnv: config.multiEnv,
    pureProxy: config.pureProxy,
    notHTTPS: config.notAllowedEnableHTTPS,
    baseDir: baseDir,
    username: config.whistleName && config.username ? config.username + ' (' + config.whistleName + ')' : (config.username || config.whistleName),
    nodeVersion: process.version,
    latestVersion: properties.getLatestVersion('latestVersion'),
    latestClientVersion: properties.getLatestVersion('latestClientVersion'),
    host: util.hostname(),
    isWin: util.isWin,
    port: config.port,
    realPort: config.realPort,
    realHost: config.realHost,
    socksPort: config.socksPort,
    httpPort: config.httpPort,
    httpsPort: config.httpsPort,
    ipv4: [],
    ipv6: [],
    mac: req.ip + (config.storage ? '\n' + config.storage : '')
  };
  var serverInfo = util.getServerInfo();
  info.ipv4 = serverInfo.ipv4;
  info.ipv6 = serverInfo.ipv6;
  return info;
};

var DATA_RE = /[\r\n]\s*(\{[\s\S]*\})[\r\n]/;
var REPLACE_RE = /[\r\n]1[\r\n]/;
var EXCEED_SIZE_ERR = new Error('The file size can not exceed 6MB');
var INVALID_CONTENT_ERR = new Error('The file content is not a JSON object');

exports.getReqData = function(req, callback) {
  var result = [];
  var len = 0;
  var done;
  var handleCb = function(err, data) {
    if (!done) {
      done = true;
      callback(err, data);
      result = null;
    }
  };
  req.on('data', function(chunk) {
    if (done) {
      return;
    }
    len += chunk.length;
    result.push(chunk);
    if (len > MAX_OBJECT_SIZE) {
      handleCb(EXCEED_SIZE_ERR);
    }
  });
  req.on('error', handleCb);
  req.on('end', function() {
    if (done) {
      return;
    }
    var data;
    result = Buffer.concat(result).toString();
    result = result.replace(DATA_RE, function(all, match) {
      data = match;
      return '';
    });
    if (!data) {
      return handleCb(INVALID_CONTENT_ERR);
    }
    try {
      data = JSON.parse(data);
    } catch(err) {
      return handleCb(err);
    }
    handleCb(null, {
      data: data,
      replace: REPLACE_RE.test(result)
    });
  });
};

function formatDate() {
  var date = new Date();
  var result = [];
  result.push(date.getFullYear());
  result.push(padLeft(date.getMonth() + 1));
  result.push(padLeft(date.getDate()));
  result.push(padLeft(date.getHours()));
  result.push(padLeft(date.getMinutes()));
  result.push(padLeft(date.getSeconds()));
  result.push(padLeft(date.getMilliseconds(), 3));
  return result.join('');
}

exports.formatDate = formatDate;

exports.getClientIp = util.getClientIp;

function sendError(res, err) {
  util.sendRes(res, 500, config.debugMode ?
    '<pre>' + util.encodeHtml(util.getErrorStack(err)) + '</pre>' : 'Internal Server Error');
}

exports.sendError = sendError;

exports.sendGzip = util.sendGzip;

exports.sendGzipText = util.sendGzipText;
