var fs = require('fs');
var path = require('path');
var Zip = require('node-native-zip');
var util = require('./util');

var fiddlerAssets = path.join(__dirname, '../../assets/fiddler/');
var fiddler2Meta = fs.readFileSync(fiddlerAssets + 'meta.xml', 'utf8');
var fiddler2TunnelMeta = fs.readFileSync(fiddlerAssets + 'tunnel_meta.xml', 'utf8');

function filterSessions(sessions) {
  return sessions.filter(function(item) {
    if (!item || !item.url || !item.req || !(item.startTime > 0)) {
      return false;
    }
    return true;
  });
}

function renderTpl(tpl, locals) {
  locals = getMetaData(locals);
  Object.keys(locals).forEach(function(name) {
    tpl = tpl.replace('${' + name + '}', locals[name]);
  });
  return tpl;
}
/**
 * <?xml version="1.0" encoding="utf-8"?>
<Session SID="${SID}">
  <SessionTimers ClientConnected="${ClientConnected}"
   ClientDoneRequest="${ClientDoneRequest}" GatewayTime="${GatewayTime}" 
   DNSTime="${DNSTime}" TCPConnectTime="${TCPConnectTime}" 
   ServerGotRequest="${ServerGotRequest}" 
   ServerBeginResponse="${ServerBeginResponse}" 
   ServerDoneResponse="${ServerDoneResponse}" 
   ClientBeginResponse="${ClientBeginResponse}" 
   ClientDoneResponse="${ClientDoneResponse}" />
  <PipeInfo />
  <SessionFlags>
    <SessionFlag N="x-ttfb" V="${ttfb}" />
    <SessionFlag N="x-processinfo" V="" />
    <SessionFlag N="x-transfer-size" V="${transfer-size}" />
    <SessionFlag N="x-clientip" V="${clientip}" />
    <SessionFlag N="x-ttlb" V="${ttlb}" />
    <SessionFlag N="x-hostip" V="${hostip}" />
    <SessionFlag N="x-clientport" V="0" />
  </SessionFlags>
</Session>
 * @param item
 * @returns
 */
function getMetaData(item) {
  var meta = {
      SID: item.index + 1
  };
  ['ClientConnected', 'ClientDoneRequest', 'ServerGotRequest', 'ServerBeginResponse', 
   'ServerDoneResponse', 'ClientBeginResponse', 'ClientDoneResponse'].forEach(function(name) {
    meta[name] = '0001-01-01T00:00:00';
  });
  ['GatewayTime', 'DNSTime', 'TCPConnectTime'].forEach(function(name) {
    meta[name] = 0;
  });
  ['ttfb', 'ttlb', 'transfer-size', 'clientip', 'hostip'].forEach(function(name) {
    meta[name] = 0;
  });
  
  meta.ClientConnected = util.toISOString(item.startTime);
  if (item.dnsTime > 0) {
    meta.DNSTime = item.dnsTime - item.startTime;
  }
  if (item.requestTime > 0) {
    meta.ClientDoneRequest = meta.ServerGotRequest = 
      meta.ServerBeginResponse = util.toISOString(item.requestTime);
  }
  
  if (item.responseTime > 0) {
    meta.ClientBeginResponse = util.toISOString(item.responseTime);
    meta.ttfb = item.responseTime - item.startTime;
  }
  
  if (item.endTime > 0) {
    meta.ServerDoneResponse = meta.ClientDoneResponse = util.toISOString(item.endTime);
    meta.ttlb = item.endTime - item.startTime;
  }
  
  var req = item.req || {};
  var res = item.res || {};
  if (res.size > 0) {
    meta['transfer-size'] = res.size;
  }
  meta.clientip = req.ip || '127.0.0.1'; 
  meta.hostip = res.ip || '127.0.0.1';
  return meta;
}

function getFiddler2Meta(item) {
  return renderTpl(fiddler2Meta, item);
}

module.exports = function(body) {
  var sessions = util.parseJSON(body.sessions);
  if (!Array.isArray(sessions)) {
    return '';
  }
  sessions = filterSessions(sessions);
  var index = 0;
  var getName = function() {
    var name = String(index);
    ++index;
    var paddingCount = 4 - name.length;
    return paddingCount <= 0 ? index : new Array(paddingCount + 1).join('0') + index;
  };
  
  var zip = new Zip();
  sessions.map(function(item, index) {
    item.req.url = item.url;
    var req = util.getReqRaw(item.req);
    var res = !item.res || item.res.statusCode == null ? 
        undefined : util.getResRaw(item.res);
    var name = getName();
    item.index = index;
    zip.add('raw/' + name + '_c.txt', new Buffer(req || ''));
    zip.add('raw/' + name + '_m.xml', new Buffer(getFiddler2Meta(item)));
    zip.add('raw/' + name + '_s.txt', new Buffer(res || ''));
  });
  
  return zip.toBuffer();
};