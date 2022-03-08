var fs = require('fs');
var path = require('path');
var Zip = require('node-native-zip2');
var Buffer = require('safe-buffer').Buffer;
var util = require('./util');

var fiddlerAssets = path.join(__dirname, '../../assets/fiddler/');
var fiddlerMeta = fs.readFileSync(fiddlerAssets + 'meta.xml', 'utf8');

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
  meta.hostip = res.ip || '127.0.0.1';
  meta.clientport = req.port || 0;
  meta.serverport = res.port || 0;
  return meta;
}

function getFiddler2Meta(item) {
  return renderTpl(fiddlerMeta, item);
}

module.exports = function (body) {
  var sessions = util.parseJSON(body.sessions);
  if (!Array.isArray(sessions)) {
    return '';
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

  var zip = new Zip();
  sessions.map(function (item, index) {
    item.req.url = item.url;
    var req = util.getReqRaw(item.req);
    var res =
      !item.res || item.res.statusCode == null
        ? Buffer.from('')
        : util.getResRaw(item.res);
    var name = getName();
    item.index = index;
    zip.add('raw/' + name + '_c.txt', req);
    zip.add('raw/' + name + '_m.xml', Buffer.from(getFiddler2Meta(item)));
    zip.add('raw/' + name + '_s.txt', res);
    zip.add(
      'raw/' + name + '_whistle.json',
      Buffer.from(
        JSON.stringify({
          version: item.version,
          nodeVersion: item.nodeVersion,
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

  return zip.toBuffer();
};
