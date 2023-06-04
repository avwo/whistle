var os = require('os');
var path = require('path');
var fse = require('fs-extra2');
var fs = require('fs');
var iconv = require('iconv-lite');
var qs = require('querystring');
var Buffer = require('safe-buffer').Buffer;
var zlib = require('./zlib');
var pkgConf = require('../../package.json');
var isUtf8 = require('./is-utf8');

var HEAD_RE = /^head$/i;
var HOME_DIR_RE = /^[~～]\//;
var REGISTRY_RE = /^--registry=https?:\/\/[^/?]/;
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
var WHISTLE_PLUGIN_RE = /^((?:@[\w-]+\/)?whistle\.[a-z\d_-]+)(?:\@([\w.^~*-]*))?$/;
var HTTP_RE = /^https?:\/\/[^/?]/;
var SEP_RE = /\s*[|,;\s]+\s*/;

exports.REMOTE_URL_RE = REMOTE_URL_RE;
exports.WHISTLE_PLUGIN_RE = WHISTLE_PLUGIN_RE;

exports.getPlugins = function(argv, isInstall) {
  return argv.filter(function(name, i) {
    if (WHISTLE_PLUGIN_RE.test(name)) {
      return true;
    }
    if (argv[i - 1] === '--registry') {
      return false;
    }
    return isInstall && REMOTE_URL_RE.test(name);
  });
};

exports.getPluginsData = function(data) {
  var cmd = data && data.cmd;
  if (!cmd || typeof cmd !== 'string' || cmd.length > 2048) {
    return;
  }
  var pkgs;
  var registry;
  cmd.trim().split(SEP_RE).forEach(function(name) {
    name = name.trim();
    if (WHISTLE_PLUGIN_RE.test(name)) {
      pkgs = pkgs || [];
      pkgs.push({
        name: RegExp.$1,
        version: RegExp.$2
      });
    } else if (!registry && REGISTRY_RE.test(name)) {
      registry = name.substring(11, 1035);
    }
  });
  return pkgs && {
    registry: registry,
    pkgs: pkgs
  };
};

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

function getDefaultWhistlePath() {
  return path.join(getHomedir(), '.WhistleAppData');
}

function getWhistlePath() {
  return getHomePath(process.env.WHISTLE_PATH) ||  getDefaultWhistlePath();
}

exports.getDefaultWhistlePath = getDefaultWhistlePath;
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

var UTF8_RE = /^utf-?8$/i;
function bufferToString(buffer, encoding) {
  if (typeof encoding === 'string') {
    encoding = encoding.trim();
  } else {
    encoding = null;
  }
  if (Buffer.isBuffer(buffer) && !UTF8_RE.test(encoding) && !isUtf8(buffer)) {
    try {
      buffer = iconv.encode(buffer, encoding || 'GB18030');
    } catch (e) {}
  }
  return String(buffer || '');
}

exports.bufferToString = bufferToString;

var URLENCODED_RE = /application\/x-www-form-urlencoded/i;
var POST_RE = /^post$/i;

function isUrlEncoded(req) {
  var type = req.method && req.headers && req.headers['content-type'];
  return type && POST_RE.test(req.method) && URLENCODED_RE.test(type);
}

exports.isUrlEncoded = isUrlEncoded;

function queryToString(query, req) {
  if (!req || typeof query !== 'object' || !isUrlEncoded(req)) {
    return query;
  }
  return qs.stringify(query);
}

exports.toBuffer = function(data, req) {
  data = queryToString(data, req);
  if (!data || Buffer.isBuffer(data)) {
    return data && data.length && data;
  }
  if (typeof data !== 'string') {
    try {
      data = JSON.stringify(data);
    } catch (e) {
      return;
    }
  }
  return Buffer.from(data);
};


exports.readStream = function(stream, callback) {
  var buffer = null;
  stream.on('data', function(chunk) {
    buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
  });
  stream.once('end', function() {
    var buf;
    var text;
    var json;
    var err;
    var jsonErr;
    stream.zlib = zlib;
    var encoding = stream.headers && stream.headers['content-encoding'];
    var getBuffer = function(cb) {
      if (err || buf !== undefined) {
        return cb(err, buf);
      }
      zlib.unzip(encoding, buffer, function(e, ctn) {
        err = e;
        buf = ctn || null;
        cb(err, buf);
      });
    };
    var getText = function(cb, ecd) {
      if (err || text != null) {
        return cb(err, text);
      }
      getBuffer(function(e, ctn) {
        err = e;
        text = bufferToString(ctn, ecd);
        cb(err, text);
      });
    };
    stream.getBuffer = getBuffer;
    stream.getText = getText;
    stream.getJson = function(cb, ecd) {
      getText(function() {
        if (err || jsonErr || !text || json !== undefined) {
          return cb(err || jsonErr, json);
        }
        try {
          if (isUrlEncoded(stream)) {
            json = qs.parse(text);
          } else {
            text = text.trim();
            if (text[0] === '[' || text[0] === '{') {
              json = JSON.parse(text) || null;
            } else {
              json = null;
            }
          }
        } catch (e) {
          jsonErr = e;
        }
        cb(jsonErr, json);
      }, ecd);
    };
    callback(buffer);
  });
};

exports.readJsonSync = function(filepath) {
  try {
    return fse.readJsonSync(filepath);
  } catch (e) {
    try {
      return fse.readJsonSync(filepath);
    } catch (e) {}
  }
};

exports.getRegistry = function(registry) {
  if (!registry || !HTTP_RE.test(registry) || registry.length > 1024) {
    return;
  }
  return registry;
};

function copyFile(src, dest, callback, retry) {
  var execCb = function (e) {
    if (e && !retry) {
      copyFile(src, dest, callback, true);
    } else {
      callback(e);
    }
  };
  if (typeof fs.copyFile === 'function') {
    fs.copyFile(src, dest, execCb);
  } else {
    fse.copy(src, dest, execCb);
  }
}

exports.copyFile = copyFile;

exports.getHostPort = function(str) {
  if (!str || (typeof str !== 'string' && typeof str !== 'number')) {
    return;
  }
  if (/^(?:([\w.-]+):)?([1-9]\d{0,4})$/.test(str) || /^\[([\w.:]+)\]:([1-9]\d{0,4})$/.test(str)) {
    return {
      host: RegExp.$1,
      port: parseInt(RegExp.$2, 10)
    };
  }
};

exports.onSocketEnd = function(socket, callback) {
  var execCallback = function (err) {
    socket._hasError = true;
    if (callback) {
      callback(err);
      callback = null;
    }
  };
  if (socket.aborted || socket.destroyed || socket._hasError) {
    return execCallback();
  }
  socket.on('error', execCallback);
  socket.once('close', execCallback);
  socket.once('end', execCallback);
  socket.once('timeout', execCallback);
};
