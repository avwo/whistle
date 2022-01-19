var os = require('os');
var path = require('path');
var fse = require('fs-extra2');
var pkgConf = require('../../package.json');

var HEAD_RE = /^head$/i;
var HOME_DIR_RE = /^[~～]\//;
var ILLEGAL_TRALIERS = ['host', 'transfer-encoding', 'content-length', 'cache-control', 'te', 'max-forwards', 'authorization', 'set-cookie', 'content-encoding', 'content-type', 'content-range', 'trailer', 'connection', 'upgrade', 'http2-settings', 'proxy-connection', 'transfer-encoding', 'keep-alive'];

function isHead(req) {
  return HEAD_RE.test(req.method);
}

exports.isHead = isHead;

exports.noop = function() {};

function removeIPV6Prefix(ip) {
  if (typeof ip != 'string') {
    return '';
  }
  return ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
}

exports.removeIPV6Prefix = removeIPV6Prefix;

function hasBody(res, req) {
  if (req && isHead(req)) {
    return false;
  }
  var statusCode = res.statusCode;
  return !(statusCode == 204 || (statusCode >= 300 && statusCode < 400) ||
    (100 <= statusCode && statusCode <= 199));
}

exports.hasBody = hasBody;

function isEmptyObject(a) {
  if (a) {
    for (var i in a) { // eslint-disable-line
      return false;
    }
  }
  return true;
}

exports.isEmptyObject = isEmptyObject;

exports.lowerCaseify = function(obj, rawNames) {
  var result = {};
  if (!obj) {
    return result;
  }
  Object.keys(obj).forEach(function(name) {
    var value = obj[name];
    if (value !== undefined) {
      var key  = name.toLowerCase();
      result[key] = Array.isArray(value) ? value : value + '';
      if (rawNames) {
        rawNames[key] = name;
      }
    }
  });
  return result;
};

exports.removeIllegalTrailers = function(headers) {
  ILLEGAL_TRALIERS.forEach(function(key) {
    delete headers[key];
  });
};

exports.addTrailerNames = function(res, newTrailers, rawNames, delTrailers, req) {
  if (!hasBody(res, req) || isEmptyObject(newTrailers)) {
    return;
  }
  var headers = res.headers;
  delete headers['content-length'];
  delete headers['transfer-encoding'];
  var nameMap = {};
  var curTrailers = headers.trailer;
  if (curTrailers) {
    if (typeof curTrailers === 'string') {
      nameMap[curTrailers.toLowerCase()] = curTrailers;
    } else if (Array.isArray(curTrailers)) {
      curTrailers.forEach(function(key) {
        if (key && typeof key === 'string') {
          nameMap[key.toLowerCase()] = key;
        }
      });
    }
  }
  Object.keys(newTrailers).forEach(function(key) {
    var lkey = key.toLowerCase();
    if ((!delTrailers || !delTrailers[lkey]) && ILLEGAL_TRALIERS.indexOf(lkey) === -1) {
      nameMap[lkey] = key;
    }
  });
  if (rawNames && !rawNames.trailer) {
    rawNames.trailer = 'Trailer';
  }
  headers.trailer = Object.keys(nameMap).map(function(key) {
    return nameMap[key];
  });
};

exports.onResEnd = function(res, callback) {
  var state = res._readableState || '';
  if (state.endEmitted) {
    return callback();
  }
  res.on('end', callback);
};

var UPGRADE_RE = /^\s*upgrade\s*$/i;
var WS_RE = /^\s*websocket\s*$/i;
var CONNECT_RE = /^\s*CONNECT\s*$/i;
var CONNECT_PROTOS = 'connect:,socket:,tunnel:,conn:,tls:,tcp:'.split(',');

function isWebSocket(options, headers) {
  var p = options.protocol;
  if (p === 'ws:' || p === 'wss:' || options.method === 'UPGRADE') {
    return true;
  }
  return headers && UPGRADE_RE.test(headers.connection) && WS_RE.test(headers.upgrade);
}

function isConnect(options) {
  return CONNECT_RE.test(options.method) || CONNECT_PROTOS.indexOf(options.protocol) !== -1;
}

exports.isWebSocket = isWebSocket;
exports.isConnect = isConnect;

var PROTOCOL_RE = /^[a-z0-9.-]+:\/\//i;

function hasProtocol(url) {
  return PROTOCOL_RE.test(url);
}

function setProtocol(url, isHttps) {
  return hasProtocol(url) ? url : (isHttps ? 'https://' : 'http://') + url;
}

function getProtocol(url) {
  return hasProtocol(url) ? url.substring(0, url.indexOf('://') + 1) : null;
}

function removeProtocol(url, clear) {
  return hasProtocol(url) ? url.substring(url.indexOf('://') + (clear ? 3 : 1)) : url;
}

function replaceProtocol(url, protocol) {
  return (protocol || 'http:') +  removeProtocol(url);
}

exports.hasProtocol = hasProtocol;
exports.setProtocol = setProtocol;
exports.getProtocol = getProtocol;
exports.removeProtocol = removeProtocol;
exports.replaceProtocol = replaceProtocol;

function getHomedir() {
  //默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

exports.getHomedir = getHomedir;

function getHomePath(dir) {
  if (!dir || !HOME_DIR_RE.test(dir)) {
    return dir;
  }
  return path.join(getHomedir(), '.' + dir.substring(1));
}

exports.getHomePath = getHomePath;

function getWhistlePath() {
  return getHomePath(process.env.WHISTLE_PATH) || path.join(getHomedir(), '.WhistleAppData');
}

exports.getWhistlePath = getWhistlePath;

exports.getLogFile = function() {
  var whistlePath = getWhistlePath();
  fse.ensureDirSync(whistlePath);
  return path.join(whistlePath, pkgConf.name + '.log');
};
