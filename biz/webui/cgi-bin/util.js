var gzip = require('zlib').gzip;
var util = require('../../../lib/util');
var config = require('../../../lib/config');
var proc = require('../../../lib/util/process');
var properties = require('../../../lib/rules/util').properties;

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
    pid: PID,
    pInfo: proc,
    dcc: config.disableCustomCerts,
    dns: dnsOverHttps || config.dnsServer,
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
    baseDir: baseDir,
    username: config.username,
    nodeVersion: process.version,
    latestVersion: properties.getLatestVersion('latestVersion'),
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
  var ifaces = util.networkInterfaces();
  Object.keys(ifaces).forEach(function(ifname) {
    ifaces[ifname].forEach(function (iface) {
      if (iface.internal) {
        return;
      }
      info[iface.family == 'IPv4' || iface.family === 4 ? 'ipv4' : 'ipv6'].push(iface.address);
    });
  });

  return info;
};

var DATA_RE = /[\r\n]\s*(\{[\s\S]*\})[\r\n]/;
var REPLACE_RE = /[\r\n]1[\r\n]/;
exports.getReqData = function(req, callback) {
  var result = '';
  req.on('data', function(chunk) {
    result = result ? Buffer.concat([result, chunk]) : chunk;
    if (result.length > MAX_OBJECT_SIZE) {
      req.removeAllListeners('data');
      callback(new Error('The file size can not exceed 6m.'));
    }
  });
  req.on('error', callback);
  req.on('end', function() {
    result += '';
    var data;
    result = result.replace(DATA_RE, function(all, match) {
      data = match;
      return '';
    });
    if (!data) {
      return callback(new Error('The file content is not a JSON object'));
    }
    try {
      data = JSON.parse(data);
    } catch(err) {
      return callback(err);
    }
    callback(null, {
      data: data,
      replace: REPLACE_RE.test(result)
    });
  });
};

function padding(num) {
  return num < 10 ? '0' + num : num;
}

function paddingMS(ms) {
  if (ms > 99) {
    return ms;
  }
  if (ms > 9) {
    return '0' + ms;
  }
  return '00' + ms;
}

function formatDate() {
  var date = new Date();
  var result = [];
  result.push(date.getFullYear());
  result.push(padding(date.getMonth() + 1));
  result.push(padding(date.getDate()));
  result.push(padding(date.getHours()));
  result.push(padding(date.getMinutes()));
  result.push(padding(date.getSeconds()));
  result.push(paddingMS(date.getMilliseconds()));
  return result.join('');
}

exports.formatDate = formatDate;

exports.getClientIp = util.getClientIp;

exports.sendGzip = function(req, res, data) {
  if (!util.canGzip(req)) {
    return res.json(data);
  }
  gzip(JSON.stringify(data), function(err, result) {
    if (err) {
      try {
        res.json(data);
      } catch (e) {
        res.status(500).send(config.debugMode ?
          '<pre>' + util.encodeHtml(util.getErrorStack(err)) + '</pre>' : 'Internal Server Error');
      }
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Encoding': 'gzip',
      'Content-Length': result.length
    });
    res.end(result);
  });
};
