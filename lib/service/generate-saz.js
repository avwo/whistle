var fs = require('fs');
var path = require('path');
var Zip = require('node-native-zip');
var util = require('./util');

var fiddlerAssets = path.join(__dirname, '../../assets/fiddler/');
var fiddler4Types = fs.readFileSync(fiddlerAssets + 'v4/[Content_Types].xml');
var fiddler2Meta = fs.readFileSync(fiddlerAssets + 'v2/meta.xml', 'utf8');
var fiddler2TunnelMeta = fs.readFileSync(fiddlerAssets + 'v2/tunnel_meta.xml', 'utf8');
var fiddler4Meta = fs.readFileSync(fiddlerAssets + 'v4/meta.xml', 'utf8');
var fiddler4TunnelMeta = fs.readFileSync(fiddlerAssets + 'v4/tunnel_meta.xml', 'utf8');

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

function getMetaData(item) {
  var meta = {
      SID: item.index + 1
  };
  ['ClientConnected', 'ClientBeginRequest', 'GotRequestHeaders', 
   'ClientDoneRequest', 'FiddlerBeginRequest', 'ServerConnected', 
   'ServerGotRequest', 'ServerBeginResponse', 'GotResponseHeaders', 
   'ServerDoneResponse', 'ClientBeginResponse', 'ClientDoneResponse'].forEach(function(name) {
    meta[name] = '0001-01-01T00:00:00';
  });
  ['GatewayTime', 'DNSTime', 
   'TCPConnectTime', 'HTTPSHandshakeTime'].forEach(function(name) {
    meta[name] = 0;
  });
  ['ttfb', 'ttlb', 'transfer-size', 'clientip', 'hostip', 
   'responsebodytransferlength'].forEach(function(name) {
    meta[name] = 0;
  });
  
  meta.ClientConnected = util.toISOString(item.startTime);
  if (item.dnsTime > 0) {
    meta.DNSTime = item.dnsTime - item.startTime;
    meta.ClientBeginRequest =  meta.GotRequestHeaders = 
      meta.FiddlerBeginRequest = meta.ServerConnected = util.toISOString(item.dnsTime);
  }
  if (item.requestTime > 0) {
    meta.ClientDoneRequest = meta.ServerGotRequest = 
      meta.ServerBeginResponse = util.toISOString(item.requestTime);
  }
  
  if (item.responseTime > 0) {
    meta.GotResponseHeaders = meta.ClientBeginResponse = util.toISOString(item.responseTime);
    meta.ttfb = item.responseTime - item.startTime;
  }
  
  if (item.endTime > 0) {
    meta.ServerDoneResponse = meta.ClientDoneResponse = util.toISOString(item.endTime);
    meta.ttlb = item.endTime - item.startTime;
  }
  
  var req = item.req || {};
  var res = item.res || {};
  if (res.size > 0) {
    meta['transfer-size'] = meta.responsebodytransferlength = res.size;
  }
  if (req.ip) {
    meta.clientip = req.ip;
  } 
  if (res.ip) {
    meta.hostip = res.ip;
  }
  return meta;
}

function getFiddler2Meta(item) {
  return renderTpl(fiddler2Meta, item);
}

function getFiddler4Meta(item) {
  return renderTpl(fiddler4Meta, item);
}

module.exports = function(body) {
  var isFiddler2 = body.exportFileType === 'Fiddler2';
  if (!isFiddler2 && body.exportFileType !== 'Fiddler4') {
    return false;
  }
  var sessions = util.parseJSON(body.sessions);
  if (!Array.isArray(sessions)) {
    return '';
  }
  sessions = filterSessions(sessions);
  var count = isFiddler2 ? 4 : String(sessions.length).length;
  var index = 0;
  var getName = function() {
    var name = (isFiddler2 ? index : index + 1) + '';
    ++index;
    var paddingCount = count - name.length;
    if (paddingCount <= 0) {
      return name;
    }
    return new Array(paddingCount + 1).join('0') + name;
  };
  
  var zip = new Zip();
  !isFiddler2 && zip.add('\[Content_Types\].xml', fiddler4Types);
  sessions.map(function(item, index) {
    item.req.url = item.url;
    var req = util.getReqRaw(item.req);
    var res = !item.res || item.res.statusCode == null ? 
        undefined : util.getResRaw(item.res);
    var name = getName();
    item.index = index;
    zip.add('raw/' + name + '_c.txt', new Buffer(req || ''));
    zip.add('raw/' + name + '_m.xml', new Buffer(isFiddler2 ? getFiddler2Meta(item) : getFiddler4Meta(item)));
    zip.add('raw/' + name + '_s.txt', new Buffer(res || ''));
  });
  
  return zip.toBuffer();
};