var util = require('../lib/util');
var config = require('../lib/config');
var properties = require('../lib/properties');

var MAX_OBJECT_SIZE = 1024 * 1024 * 6;
var index = 0;

exports.getClientId = function() {
  if (index > 9999) {
    index = 0;
  }
  return Date.now() + '-' + index++;
};

exports.getServerInfo = function getServerInfo(req) {
  var info = {
    version: config.version,
    networkMode: config.networkMode,
    multiEnv: config.multiEnv,
    baseDir: config.baseDirHash,
    username: config.username,
    nodeVersion: process.version,
    latestVersion: properties.get('latestVersion'),
    host: util.hostname(),
    isWin: util.isWin,
    port: config.port,
    weinrePort: config.weinreport,
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
      info[iface.family == 'IPv4' ? 'ipv4' : 'ipv6'].push(iface.address);
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
