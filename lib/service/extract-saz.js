var AdmZip = require('adm-zip');
var parseString = require('xml2js').parseString;
var util = require('./util');

function getMetaAttrs(meta) {
  meta = meta && meta.Session;
  if (!meta) {
    return {};
  }
  var result = meta.SessionTimers && meta.SessionTimers[0];
  result = result && result.$ || {};
  var SessionFlag = meta.SessionFlags && meta.SessionFlags[0] && meta.SessionFlags[0].SessionFlag;
  if (Array.isArray(SessionFlag)) {
    SessionFlag.forEach(function(flag) {
      flag = flag && flag.$;
      if (!flag || typeof flag.N !== 'string') {
        return;
      }
      result[flag.N] = flag.V || '';
    });
  }
  return result;
}

function parseMetaInfo(result) {
  var meta = getMetaAttrs(result.meta);
  result.startTime = new Date(meta.ClientConnected).getTime() || 0;
  if (meta.ClientDoneRequest) {
    var requestTime = new Date(meta.ClientDoneRequest).getTime();
    if (requestTime) {
      result.requestTime = requestTime;
    }
  }
  if (meta.ClientBeginResponse) {
    var responseTime = new Date(meta.ClientBeginResponse).getTime();
    if (responseTime) {
      result.responseTime = responseTime;
    }
  }
  if (meta.ClientDoneResponse) {
    var endTime = new Date(meta.ClientDoneResponse).getTime();
    if (endTime) {
      result.endTime = endTime;
    }
  }
  result.rules = {};
  var req = result.req;
  var res = result.res = result.res || {};
  result.hostIp = res.ip = meta['x-hostip'];
  result.clientIp = req.ip = meta['x-clientip'];
  var size = meta['x-transfer-size'] || meta['x-responsebodytransferlength'];
  if (typeof size === 'string') {
    size = parseInt(size.replace(/\s*,\s*/g, ''), 10);
  }
  if (size > -1) {
    res.size = size;
  }
  if (req.method === 'CONNECT') {
    result.url = req.url;
    result.isHttps = true;
  } else {
    result.url = /^[^:/]+:\/\//.test(req.url) ? req.url : 'http://' + req.headers.host + req.url;
    if (/\bwebsocket\b/i.test(req.headers.upgrade)) {
      result.url = result.url.replace(/^http/, 'ws');
    }
  }
}

module.exports = function(buffer, cb) {
  var zip = new AdmZip(buffer);
  var zipEntries = zip.getEntries();
  var sessions = {};
  var count = 0;
  var execCallback = function() {
    if (count <= 0) {
      var result = [];
      Object.keys(sessions).forEach(function(key) {
        var session = sessions[key];
        if (session.req && session.meta) {
          parseMetaInfo(session);
          result.push(session);
        }
      });
      cb(result);
    }
  };
  zipEntries.forEach(function(entry) {
    if (entry.isDirectory) {
      return;
    }
    var entryName = entry.entryName;
    var filename = entryName.substring(4);
    var dashIndex = filename.indexOf('_');
    if (dashIndex <= 0) {
      return;
    }
    var index = filename.substring(0, dashIndex);
    filename = filename.substring(dashIndex + 1).toLowerCase();
    if (!/^\d+$/.test(index) || ['c.txt', 'm.xml', 's.txt'].indexOf(filename) === -1) {
      return;
    }
    var content = zip.readFile(entryName);
    if (!content) {
      return;
    }
    var result = sessions[index] = sessions[index] || {};
    if (filename === 'c.txt') {
      result.req = util.getReq(content);
    } else if (filename === 'm.xml') {
      ++count;
      parseString(content, function(err, meta) {
        process.nextTick(function() {
          result.meta = meta;
          --count;
          execCallback();
        });
      });
    } else {
      result.res = util.getRes(content);
    }
  });
  execCallback();
};