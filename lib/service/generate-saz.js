var fs = require('fs');
var path = require('path');
var AdmZip = require('adm-zip');
var Buffer = require('safe-buffer').Buffer;
var util = require('./util');

var fiddlerAssets = path.join(__dirname, '../../assets/fiddler/');
var fiddlerMeta = fs.readFileSync(fiddlerAssets + 'meta.xml', 'utf8');
var SPEC_XML_RE = /[<>&"']/g;
var specMap = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '\'': '&apos;',
  '"': '&quot;'
};

function filterSessions(sessions) {
  return sessions.filter(function (item) {
    if (!item || !item.url || !item.req || !(item.startTime >= 0)) {
      return false;
    }
    return true;
  });
}

function renderTpl(tpl, locals) {
  locals = getMetaData(locals);
  Object.keys(locals).forEach(function (name) {
    tpl = tpl.replace('${' + name + '}', locals[name]);
  });
  return tpl;
}

function escapeXml(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.replace(SPEC_XML_RE, function(char) {
    return specMap[char] || char;
  });
}

function getMetaData(item) {
  var meta = {
    SID: item.index + 1
  };
  [
    'ClientConnected',
    'ClientDoneRequest',
    'ServerGotRequest',
    'ServerBeginResponse',
    'ServerDoneResponse',
    'ClientBeginResponse',
    'ClientDoneResponse'
  ].forEach(function (name) {
    meta[name] = '0001-01-01T00:00:00';
  });
  ['GatewayTime', 'DNSTime', 'TCPConnectTime'].forEach(function (name) {
    meta[name] = 0;
  });
  ['ttfb', 'ttlb', 'transfer-size', 'clientip', 'hostip'].forEach(function (
    name
  ) {
    meta[name] = 0;
  });
  var comment = item.customData && item.customData.comment;
  meta['ui-comments'] = escapeXml(comment);

  meta.ClientConnected = util.toISOString(item.startTime);
  if (item.dnsTime >= item.startTime) {
    meta.DNSTime = item.dnsTime - item.startTime;
  }
  if (item.requestTime > 0) {
    meta.ClientDoneRequest =
      meta.ServerGotRequest =
      meta.ServerBeginResponse =
        util.toISOString(item.requestTime);
  }

  if (item.responseTime > 0) {
    meta.ClientBeginResponse = util.toISOString(item.responseTime);
    meta.ttfb = item.responseTime - item.startTime;
  }

  if (item.endTime > 0) {
    meta.ServerDoneResponse = meta.ClientDoneResponse = util.toISOString(
      item.endTime
    );
    meta.ttlb = item.endTime - item.startTime;
  }

  var req = item.req || {};
  var res = item.res || {};
  if (res.size > 0) {
    meta['transfer-size'] = res.size;
  }
  meta.clientip = req.ip || '127.0.0.1';
  meta.hostip = res.ip || '';
  meta.clientport = req.port || 0;
  meta.serverport = res.port || 0;
  return meta;
}

function getFiddler2Meta(item) {
  return renderTpl(fiddlerMeta, item);
}

module.exports = function (body, callback) {
  var sessions = body;
  if (!Array.isArray(sessions)) {
    sessions = util.parseJSON(body.sessions);
    if (!Array.isArray(sessions)) {
      return '';
    }
  }
  sessions = filterSessions(sessions);
  var index = 0;
  var getName = function () {
    var name = String(index);
    ++index;
    var paddingCount = 4 - name.length;
    return paddingCount <= 0
      ? name
      : new Array(paddingCount + 1).join('0') + name;
  };

  var zip = new AdmZip();
  sessions.map(function (item, index) {
    item.req.url = item.url;
    var req = util.getReqRaw(item.req);
    var res =
      !item.res || item.res.statusCode == null
        ? Buffer.from('')
        : util.getResRaw(item.res);
    var name = getName();
    item.index = index;
    zip.addFile('raw/' + name + '_c.txt', req);
    zip.addFile('raw/' + name + '_m.xml', Buffer.from(getFiddler2Meta(item)));
    zip.addFile('raw/' + name + '_s.txt', res);
    zip.addFile(
      'raw/' + name + '_whistle.json',
      Buffer.from(
        JSON.stringify({
          version: item.version,
          nodeVersion: item.nodeVersion,
          customData: item.customData,
          url: item.url,
          realUrl: item.realUrl,
          fwdHost: item.fwdHost,
          rules: item.rules,
          frames: item.frames,
          useHttp: item.useHttp,
          httpsTime: item.httpsTime,
          useH2: item.useH2,
          mark: item.mark,
          sniPlugin: item.sniPlugin,
          trailers: item.res && item.res.trailers,
          rawTrailerNames: item.res && item.res.rawTrailerNames,
          captureError: item.captureError,
          reqError: item.reqError,
          resError: item.resError,
          times: {
            startTime: item.startTime,
            dnsTime: item.dnsTime,
            requestTime: item.requestTime,
            responseTime: item.responseTime,
            endTime: item.endTime
          }
        })
      )
    );
  });
  var done;
  var handleCallback = function(err, body) {
    if (done) {
      return;
    }
    done = true;
    callback(err, body);
  };
  return zip.toBuffer(function(body) {
    handleCallback(null, body);
  }, handleCallback);
};
