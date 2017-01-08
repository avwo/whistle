var fs = require('fs');
var path = require('path');
var Zip = require('node-native-zip');
var util = require('./util');

var fiddlerAssets = path.join(__dirname, '../../assets/fiddler/');
var fiddler2Meta = fs.readFileSync(fiddlerAssets + 'v2/meta.xml');
var fiddler4Types = fs.readFileSync(fiddlerAssets + 'v4/[Content_Types].xml');
var fiddler4Meta = fs.readFileSync(fiddlerAssets + 'v4/meta.xml');

function filterSessions(sessions) {
  return sessions.filter(function(item) {
    if (!item || !item.path || !item.req) {
      return;
    }
    return item && item.path && item.req;
  });
}

function render(tpl, locals) {
  Object.keys(locals).forEach(function(name) {
    tpl = tpl.replace('${' + name + '}', locals[name]);
  });
  return tpl;
}

/**
 * ClientConnected="${ClientConnected}"
   ClientDoneRequest="${ClientDoneRequest}"
   GatewayTime="${GatewayTime}" 
   DNSTime="${DNSTime}" 
   TCPConnectTime="${TCPConnectTime}" 
   ServerGotRequest="${ServerGotRequest}" 
   ServerBeginResponse="${ServerBeginResponse}" 
   ServerDoneResponse="${ServerDoneResponse}" 
   ClientBeginResponse="${ClientBeginResponse}" 
   ClientDoneResponse="${ClientDoneResponse}
 * @param meta
 * @returns
 */

function getFiddler2Meta(meta) {
  
  return fiddler2Meta;
}

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
    item.req.path = item.path;
    var req = util.getReqRaw(item.req);
    var res = !item.res || item.res.statusCode == null ? 
        undefined : util.getResRaw(item.res);
    var name = getName();
    zip.add('raw/' + name + '_c.txt', new Buffer(req || ''));
    zip.add('raw/' + name + '_m.txt', new Buffer(isFiddler2 ? getFiddler2Meta() : getFiddler4Meta()));
    zip.add('raw/' + name + '_s.txt', new Buffer(res || ''));
  });
  
  return zip.toBuffer();
};