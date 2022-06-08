var os = require('os');
var path = require('path');
var fse = require('fs-extra2');
var fs = require('fs');
var pkgConf = require('../../package.json');

var HEAD_RE = /^head$/i;
var HOME_DIR_RE = /^[~～]\//;
var ILLEGAL_TRAILERS = [
  'host',
  'transfer-encoding',
  'content-length',
  'cache-control',
  'te',
  'max-forwards',
  'authorization',
  'set-cookie',
  'content-encoding',
  'content-type',
  'content-range',
  'trailer',
  'connection',
  'upgrade',
  'http2-settings',
  'proxy-connection',
  'transfer-encoding',
  'keep-alive'
];
var REMOTE_URL_RE = /^\s*((?:git[+@]|github:)[^\s]+\/whistle\.[a-z\d_-]+(?:\.git)?|https?:\/\/[^\s]+)\s*$/i;

exports.REMOTE_URL_RE = REMOTE_URL_RE;

function isHead(req) {
  return HEAD_RE.test(req.method);
}

exports.isHead = isHead;


exports.getUpdateUrl = function(conf) {
  var url = conf.updateUrl;
  if (url && REMOTE_URL_RE.test(url) && url.length < 2100) {
    return url;
  }
};

exports.noop = function () {};

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
  return !(
    statusCode == 204 ||
    (statusCode >= 300 && statusCode < 400) ||
    (100 <= statusCode && statusCode <= 199)
  );
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

exports.lowerCaseify = function (obj, rawNames) {
  var result = {};
  if (!obj) {
    return result;
  }
  Object.keys(obj).forEach(function (name) {
    var value = obj[name];
    if (value !== undefined) {
      var key = name.toLowerCase();
      result[key] = Array.isArray(value) ? value : value + '';
      if (rawNames) {
        rawNames[key] = name;
      }
    }
  });
  return result;
};

exports.removeIllegalTrailers = function (headers) {
  ILLEGAL_TRAILERS.forEach(function (key) {
    delete headers[key];
  });
};

exports.addTrailerNames = function (
  res,
  newTrailers,
  rawNames,
  delTrailers,
  req
) {
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
      curTrailers.forEach(function (key) {
        if (key && typeof key === 'string') {
          nameMap[key.toLowerCase()] = key;
        }
      });
    }
  }
  Object.keys(newTrailers).forEach(function (key) {
    var lkey = key.toLowerCase();
    if (
      (!delTrailers || !delTrailers[lkey]) &&
      ILLEGAL_TRAILERS.indexOf(lkey) === -1
    ) {
      nameMap[lkey] = key;
    }
  });
  if (rawNames && !rawNames.trailer) {
    rawNames.trailer = 'Trailer';
  }
  headers.trailer = Object.keys(nameMap).map(function (key) {
    return nameMap[key];
  });
};

exports.onResEnd = function (res, callback) {
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

exports.isUpgrade = function(options, headers) {
  var p = options.protocol;
  if (p === 'ws:' || p === 'wss:' || options.method === 'UPGRADE') {
    return true;
  }
  return headers && UPGRADE_RE.test(headers.connection);
};

exports.isWebSocket = function(headers) {
  return headers && WS_RE.test(headers.upgrade);
};

exports.isConnect = function(options) {
  return (
    CONNECT_RE.test(options.method) ||
    CONNECT_PROTOS.indexOf(options.protocol) !== -1
  );
};

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
  return hasProtocol(url)
    ? url.substring(url.indexOf('://') + (clear ? 3 : 1))
    : url;
}

function replaceProtocol(url, protocol) {
  return (protocol || 'http:') + removeProtocol(url);
}

exports.hasProtocol = hasProtocol;
exports.setProtocol = setProtocol;
exports.getProtocol = getProtocol;
exports.removeProtocol = removeProtocol;
exports.replaceProtocol = replaceProtocol;

function getHomedir() {
  //默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (
    (typeof os.homedir == 'function'
      ? os.homedir()
      : process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) ||
    '~'
  );
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
  return (
    getHomePath(process.env.WHISTLE_PATH) ||
    path.join(getHomedir(), '.WhistleAppData')
  );
}

exports.getWhistlePath = getWhistlePath;

function getLogFile(name) {
  var whistlePath = getWhistlePath();
  fse.ensureDirSync(whistlePath);
  return path.join(whistlePath, pkgConf.name + (name ? '-' + name : '') + '.log');
}

exports.getLogFile = getLogFile;

function padLeft(n) {
  return n > 9 ? n + '' : '0' + n;
}

function getDate() {
  var date = new Date();
  return date.getFullYear() + padLeft(date.getMonth() + 1) + padLeft(date.getDate());
}

exports.writeLogSync = function(msg) {
  try {
    fs.writeFileSync(getLogFile(), msg, { flag: 'a' });
  } catch (e) {
    msg += '\r\n' +  e.stack;
    try {
      fs.writeFileSync(getLogFile('error'), msg, { flag: 'a' });
    } catch (e) {
      fs.writeFileSync(getLogFile(getDate()), msg + '\r\n' +  e.stack, { flag: 'a' });
    }
  }
};

var SPEC_TAGS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '`': '&#96;'
};
var SPEC_TAG_RE = /[&<>"'`]/g;

function transformTag(tag) {
  return SPEC_TAGS[tag] || tag;
}

exports.encodeHtml = function(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(SPEC_TAG_RE, transformTag);
};

var SEP_RE_G = /^[^\n\r\S]*```+\s*$/mg;

exports.wrapRuleValue = function(key, value, size, policy) {
  if (!key || value == null) {
    return '';
  }
  if (!value || typeof value !== 'string') {
    return '\n``` ' + key + '\n\n```\n';
  }
  var isOverSize = size > 0 && value.length > size;
  if (isOverSize) {
    if (policy === 'ignore') {
      return '';
    }
    if (policy === 'empty') {
      return '\n``` ' + key + '\n\n```\n';
    }
    value = value.substring(0, size);
  }
  var list = value.match(SEP_RE_G);
  if (!list) {
    return  '\n``` ' + key + '\n' + value + '\n```\n';
  }
  list = list.map(function(item) {
    return item.trim().length;
  });
  var count = Math.max.apply(null, list) + 1;
  var sep = typeof '`'.repeat === 'function' ? '`'.repeat(count) : '```````````';
  return  '\n' + sep + ' ' + key + '\n' + value + '\n' + sep + '\n';
};

exports.isGroup = function(name) {
  return name && name[0] === '\r';
};
