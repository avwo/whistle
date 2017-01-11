var fs = require('fs');
var path = require('path');
var Zip = require('node-native-zip');
var util = require('./util');

var fiddlerAssets = path.join(__dirname, '../../assets/fiddler/');
var fiddler2Meta = fs.readFileSync(fiddlerAssets + 'v2/meta.xml');
var fiddler2TunnelMeta = fs.readFileSync(fiddlerAssets + 'v2/tunnel_meta.xml');
var fiddler4Types = fs.readFileSync(fiddlerAssets + 'v4/[Content_Types].xml');
var fiddler4Meta = fs.readFileSync(fiddlerAssets + 'v4/meta.xml');
var fiddler4TunnelMeta = fs.readFileSync(fiddlerAssets + 'v4/tunnel_meta.xml');

function filterSessions(sessions) {
  return sessions.filter(function(item) {
    if (!item || !item.url || !item.req || !(item.startTime > 0)) {
      return;
    }
    return item && item.url && item.req;
  });
}

function render(tpl, locals) {
  Object.keys(locals).forEach(function(name) {
    tpl = tpl.replace('${' + name + '}', locals[name]);
  });
  return tpl;
}

function initMetaData() {
  var meta = {};
  ['ClientConnected', 'ClientDoneRequest', 'ServerGotRequest',
   'ServerBeginResponse', 'ServerDoneResponse', 'ClientBeginResponse',
   'ClientDoneResponse', 'ClientBeginRequest', 'GotRequestHeaders',
   'ServerConnected', 'FiddlerBeginRequest', 'GotResponseHeaders'].forEach(function(name) {
    meta[name] = '0001-01-01T00:00:00';
  });
  ['GatewayTime', 'DNSTime', 
   'TCPConnectTime', 'HTTPSHandshakeTime'].forEach(function(name) {
    meta[name] = 0;
  });
  ['ttfb', 'processinfo', 'transfer-size', 'clientip', 'ttlb', 'hostip', 
   'clientport', 'responsebodytransferlength', 'egressport', 'ui-color', 'builder-maxredir',
   'createdtunnel', 'Fiddler-Created-This-CONNECT-Tunnel'].forEach(function(name) {
    meta[name] = 0;
  });
  return meta;
}

/**
 * 
<?xml version="1.0" encoding="utf-8"?>
<Session SID="${SID}">
  <SessionTimers ClientConnected="${ClientConnected}"
   ClientDoneRequest="${ClientDoneRequest}"
   GatewayTime="${GatewayTime}" DNSTime="${DNSTime}" TCPConnectTime="${TCPConnectTime}" 
   ServerGotRequest="${ServerGotRequest}" 
   ServerBeginResponse="${ServerBeginResponse}" 
   ServerDoneResponse="${ServerDoneResponse}" 
   ClientBeginResponse="${ClientBeginResponse}" 
   ClientDoneResponse="${ClientDoneResponse}" />
  <PipeInfo />
  <SessionFlags>
    <SessionFlag N="x-ttfb" V="${ttfb}" />
    <SessionFlag N="x-processinfo" V="${processinfo}" />
    <SessionFlag N="x-transfer-size" V="${transfer-size}" />
    <SessionFlag N="x-clientip" V="${clientip}" />
    <SessionFlag N="x-ttlb" V="${ttlb}" />
    <SessionFlag N="x-hostip" V="${hostip}" />
    <SessionFlag N="x-clientport" V="${clientport}" />
  </SessionFlags>
</Session>

<?xml version="1.0" encoding="utf-8"?>
<Session SID="${SID}">
  <SessionTimers ClientConnected="${ClientConnected}"
   ClientDoneRequest="${ClientDoneRequest}" GatewayTime="${GatewayTime}" 
   DNSTime="${DNSTime}" TCPConnectTime="${TCPConnectTime}" ServerGotRequest="${ServerGotRequest}" 
   ServerBeginResponse="${ServerBeginResponse}" ServerDoneResponse="${ServerDoneResponse}" 
   ClientBeginResponse="${ClientBeginResponse}" ClientDoneResponse="${ClientDoneResponse}" />
  <PipeInfo />
  <SessionFlags>
    <SessionFlag N="x-processinfo" V="${processinfo}" />
    <SessionFlag N="x-clientip" V="${clientip}" />
    <SessionFlag N="x-clientport" V="${clientport}" />
  </SessionFlags>
</Session>
 */

function getFiddler2Meta(meta) {
  
  return fiddler2Meta;
}

/**
 * 
 <?xml version="1.0" encoding="utf-8"?>
<Session SID="${SID}" BitFlags="${BitFlags}">
  <SessionTimers ClientConnected="${ClientConnected}"
   ClientBeginRequest="${ClientBeginRequest}" 
   GotRequestHeaders="${GotRequestHeaders}" 
   ClientDoneRequest="${ClientDoneRequest}" 
   GatewayTime="${GatewayTime}" DNSTime="${DNSTime}" 
   TCPConnectTime="${TCPConnectTime}" HTTPSHandshakeTime="${HTTPSHandshakeTime}" 
   ServerConnected="${ServerConnected}" 
   FiddlerBeginRequest="${FiddlerBeginRequest}" 
   ServerGotRequest="${ServerGotRequest}" 
   ServerBeginResponse="${ServerBeginResponse}" 
   GotResponseHeaders="${GotResponseHeaders}" 
   ServerDoneResponse="${ServerDoneResponse}" 
   ClientBeginResponse="${ClientBeginResponse}" 
   ClientDoneResponse="${ClientDoneResponse}" />
  <PipeInfo Forwarded="${Forwarded}" />
  <SessionFlags>
    <SessionFlag N="x-responsebodytransferlength" V="${responsebodytransferlength}" />
    <SessionFlag N="x-egressport" V="${egressport}" />
    <SessionFlag N="x-autoauth" V="(default)" />
    <SessionFlag N="x-clientport" V="${clientport}" />
    <SessionFlag N="ui-color" V="${ui-color}" />
    <SessionFlag N="x-clientip" V="${clientip}" />
    <SessionFlag N="x-builder-maxredir" V="${builder-maxredir}" />
    <SessionFlag N="x-createdtunnel" V="${createdtunnel}" />
  </SessionFlags>
</Session>

<?xml version="1.0" encoding="utf-8"?>
<Session SID="${SID}" BitFlags="${BitFlags}">
  <SessionTimers ClientConnected="${ClientConnected}"
   ClientBeginRequest="${ClientBeginRequest}" 
   GotRequestHeaders="${GotRequestHeaders}" 
   ClientDoneRequest="${ClientDoneRequest}" 
   GatewayTime="${GatewayTime}" DNSTime="${DNSTime}" 
   TCPConnectTime="${TCPConnectTime}" HTTPSHandshakeTime="${HTTPSHandshakeTime}" 
   ServerConnected="${ServerConnected}" 
   FiddlerBeginRequest="${FiddlerBeginRequest}" 
   ServerGotRequest="${ServerGotRequest}" 
   ServerBeginResponse="${ServerBeginResponse}" 
   GotResponseHeaders="${GotResponseHeaders}" 
   ServerDoneResponse="${ServerDoneResponse}" 
   ClientBeginResponse="${ClientBeginResponse}" 
   ClientDoneResponse="${ClientDoneResponse}" />
  <PipeInfo Forwarded="${Forwarded}" />
  <SessionFlags>
    <SessionFlag N="x-responsebodytransferlength" V="${responsebodytransferlength}" />
    <SessionFlag N="x-egressport" V="${egressport}" />
    <SessionFlag N="x-autoauth" V="(default)" />
    <SessionFlag N="x-clientport" V="${clientport}" />
    <SessionFlag N="x-clientip" V="${clientip}" />
    <SessionFlag N="x-createdtunnel" V="Fiddler-Created-This-CONNECT-Tunnel" />
    <SessionFlag N="x-hostip" V="${hostip}" />
  </SessionFlags>
</Session>
 */
function getFiddler4Meta(meta) {
  return fiddler4Meta;
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
  !isFiddler2 && zip.add('[Content_Types].xml', fiddler4Types);
  sessions.map(function(item) {
    item.req.url = item.url;
    var req = util.getReqRaw(item.req);
    var res = !item.res || item.res.statusCode == null ? 
        undefined : util.getResRaw(item.res);
    var name = getName();
    var metaData = {
        startTime: item.startTime,
        
    };
    zip.add('raw/' + name + '_c.txt', new Buffer(req || ''));
    zip.add('raw/' + name + '_m.txt', new Buffer(isFiddler2 ? getFiddler2Meta() : getFiddler4Meta()));
    zip.add('raw/' + name + '_s.txt', new Buffer(res || ''));
  });
  
  return zip.toBuffer();
};