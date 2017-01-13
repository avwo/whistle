var AdmZip = require('adm-zip');
var parseString = require('xml2js').parseString;
var util = require('./util');

function getMetaAttrs(meta) {
  meta = meta && meta.Session && meta.Session.SessionTimers && meta.Session.SessionTimers[0];
  return meta && meta.$ || {};
}

function parseMetaInfo(result, meta) {
  meta = getMetaAttrs(meta);
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
}

module.exports = function(buffer, cb) {
  var zip = new AdmZip(buffer);
  var zipEntries = zip.getEntries();
  var sessions = {};
  var count = 0;
  var execCallback = function() {
    if (count <= 0) {
      var result = [];
      var index = 10000;
      Object.keys(sessions).forEach(function(key) {
        var session = sessions[key];
        var req = session.req;
        if (!req) {
          return;
        }
        if (req.method === 'CONNECT') {
          session.url = 'https://' + req.url;
          session.isHttps = true;
        } else {
          session.url = /^[^:/]+:\/\//.test(req.url) ? req.url : 'http://' + req.headers.host + req.url;
          if (/\bwebsocket\b/i.test(req.headers.upgrade)) {
            session.url = session.url.replace(/^http/, 'ws');
          }
        }
        session.id = session.startTime + '-' + ++index;
        result.push(session);
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
    var content = zip.readAsText(entryName) || '';
    var result = sessions[index] = sessions[index] || {};
    if (filename === 'c.txt') {
      result.req = util.getReq(content);
    } else if (filename === 'm.xml') {
      ++count;
      parseString(content, function(err, meta) {
        parseMetaInfo(result, meta);
        --count;
        process.nextTick(execCallback);
      });
    } else {
      result.res = util.getRes(content);
    }
  });
  execCallback();
};