var os = require('os');
var path = require('path');
var fse = require('fs-extra2');
var fs = require('fs');
var iconv = require('iconv-lite');
var qs = require('querystring');
var zlib = require('zlib');
var net = require('net');
var http = require('http');
var crypto = require('crypto');
var json5 = require('json5');
var extend = require('extend');
var tls = require('tls');
var https = require('https');
var zlibx = require('./zlib');
var pkgConf = require('../../package.json');
var isUtf8 = require('./is-utf8');
var PassThrough = require('stream').PassThrough;
var parseUrl = require('./parse-url');

var ALGORITHM = 'aes-256-cbc';
var gzip = zlib.gzip;
var LOCALHOST = '127.0.0.1';
var CONN_TIMEOUT = 30000;
var LINE_END_RE = /\r\n|\n|\r/;
var HEAD_RE = /^head$/i;
var HOME_DIR_RE = /^[~～]\//;
var REGISTRY_RE = /^--registry=https?:\/\/[^/?]/;
var DIR_RE = /^--dir=(.+)$/;
var UTF8_OPTIONS = { encoding: 'utf8' };
var GZIP_THRESHOLD = 512;
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
var WHISTLE_PLUGIN_RE = /^((?:@[\w.~-]+\/)?whistle\.[a-z\d_-]+)(?:\@([\w.^~*-]*))?$/;
var TGZ_WHISTLE_PLUGIN_RE = /(?:^(?:file:)?|[\\/])(?:[\w.~-]+-)?whistle\.[a-z\d_-]+-\d+\.\d+\.\d+[\w.-]*\.(?:tgz|tar(?:\.gz)?)$/;
var HTTP_RE = /^https?:\/\/[^/?]/;
var SEP_RE = /\s*[|,;\s]+\s*/;
var RAW_CRLF_RE = /\\n|\\r/g;
var AUTH_RE = /^Basic /i;
var STREAM_OPTS = { highWaterMark: 1 };
var REAL_HOST_HEADER = 'x-whistle-real-host';
var supportsBr = zlib.createBrotliDecompress && zlib.createBrotliCompress;
var TIMEOUT_ERR = new Error('Timeout');
var noop = function () {};
var PATH_SEP_RE = /[\\/]/;
var CUR_PATH_RE = /^\.[\\/]/;

exports.CONN_TIMEOUT = CONN_TIMEOUT;
exports.TGZ_FILE_NAME_RE = /^(?:[\w.~-]+-)?whistle\.[a-z\d_-]+-\d+\.\d+\.\d+[\w.-]*\.(?:tgz|tar(?:\.gz)?)$/;
exports.parseUrl = parseUrl;
exports.supportsBr = supportsBr;
exports.SERVICE_HOST = 'admin.weso.pro';
exports.REMOTE_URL_RE = REMOTE_URL_RE;
exports.WHISTLE_PLUGIN_RE = WHISTLE_PLUGIN_RE;
exports.TIMEOUT_ERR = TIMEOUT_ERR;
exports.TEMP_PATH_RE = /^temp\/([\da-f]{64}|blank)(\.[\w.-]{1,20})?/;
exports.REAL_HOST_HEADER = REAL_HOST_HEADER;

function getTgzUrl(url, autoComplete) {
  if (!TGZ_WHISTLE_PLUGIN_RE.test(url)) {
    return;
  }
  if (HTTP_RE.test(url)) {
    return url;
  }
  var index = url.indexOf(':');
  if (index !== -1 && url.substring(0, index) === 'file') {
    url = url.substring(index + 1);
  }
  if (autoComplete && (!PATH_SEP_RE.test(url) || CUR_PATH_RE.test(url))) {
    url = path.join(process.cwd(), url);
  }
  return 'file:' + url;
}

exports.getPureUrl = function(url) {
  var index = url.indexOf('?');
  url = index === -1 ? url : url.substring(0, index);
  index = url.indexOf('#');
  return  index === -1 ? url : url.substring(0, index);
};

function readFileTextSync(file, safe, opts, retry) {
  try {
    return fs.readFileSync(file, opts);
  } catch (e) {}
  if (retry === true) {
    return;
  }
  return safe ? readFileTextSync(file, opts, safe, true) :
      fs.readFileSync(file, opts);
}

exports.readFileTextSync = function(file, safe) {
  return readFileTextSync(file, safe !== false, UTF8_OPTIONS);
};

exports.readFileBufferSync = function(file, safe) {
  return readFileTextSync(file, safe !== false);
};

exports.getPlugins = function(argv, isInstall, restArgv) {
  var result = [];
  argv.forEach(function(name, i) {
    if (WHISTLE_PLUGIN_RE.test(name)) {
      return result.push(name);
    }
    if (!isInstall || argv[i - 1] === '--registry') {
      restArgv && restArgv.push(name);
      return;
    }
    if (REMOTE_URL_RE.test(name)) {
      return result.push(name);
    }
    var tgzUrl = getTgzUrl(name, restArgv);
    if (tgzUrl) {
      result.push(tgzUrl);
    } else {
      restArgv && restArgv.push(name);
    }
  });
  return result;
};

exports.isPluginAddr = function(name) {
  return REMOTE_URL_RE.test(name) || TGZ_WHISTLE_PLUGIN_RE.test(name);
};

exports.parsePlugins = function(data) {
  var cmd = typeof data === 'string' ? data : (data && data.cmd);
  if (!isString(cmd) || cmd.length > 2048) {
    return;
  }
  var pkgs;
  var registry;
  var dir;
  var isDir;
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
    } else if (!dir) {
      if (DIR_RE.test(name)) {
        dir = RegExp.$1.trim();
      } else if (isDir) {
        dir = name;
      } else if (name === '--dir') {
        isDir = true;
      }
    }
  });
  return pkgs && {
    registry: registry,
    whistleDir: dir,
    pkgs: pkgs
  };
};

function readJson(filePath, callback) {
  fse.readJson(filePath, function (err, json) {
    if (!err || err.code === 'ENOENT') {
      return callback(err, json);
    }
    fse.readJson(filePath, callback);
  });
}

exports.readJson = readJson;

var PKG_NAME_RE = /[/\\]package\.json$/;

exports.getPeerPlugins = function (pkgs, root, cb) {
  var peerPlugins = [];
  var curPlugins = {};
  var len = pkgs.length;
  if (typeof pkgs === 'string') {
    pkgs = [{ name: pkgs }];
  } else if (!Array.isArray(pkgs)) {
    pkgs = [pkgs];
  }
  if (typeof root === 'function') {
    cb = root;
    root = null;
  }
  pkgs.forEach(function(pkg) {
    curPlugins[pkg.name] = 1;
  });
  var index = len;
  for (var i = 0; i < len; i++) {
    var pkg = pkgs[i];
    var pkgFile = pkg.root || root;
    if (!PKG_NAME_RE.test(pkgFile)) {
      pkgFile = path.join(pkgFile, 'node_modules', pkgs[i].name, 'package.json');
    }
    readJson(pkgFile, function (err, pkg) {
      pkg = !err && pkg && pkg.whistleConfig;
      if (pkg) {
        var list = pkg.peerPluginList || pkg.peerPlugins;
        if (Array.isArray(list) && list.length < 16) {
          list.forEach(function (pkgName) {
            pkgName = typeof pkgName === 'string' ? pkgName.trim() : null;
            if (WHISTLE_PLUGIN_RE.test(pkgName)) {
              pkgName = RegExp.$1;
              var version = RegExp.$2;
              if (!curPlugins[pkgName]) {
                curPlugins[pkgName] = 1;
                peerPlugins.push({
                  name: pkgName,
                  version
                });
              }
            }
          });
        }
      }
      if (--index <= 0) {
        cb(peerPlugins);
      }
    });
  }
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

exports.noop = noop;

function removeIPV6Prefix(ip) {
  if (!isString(ip)) {
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
  return !a || !Object.keys(a).length;
}

exports.isEmptyObject = isEmptyObject;

function lowerCaseify(obj, rawNames) {
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
}

exports.lowerCaseify = lowerCaseify;

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
        if (isString(key)) {
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

var NO_PROTO_RE = /[^a-zA-Z0-9.-]/;

function hasProtocol(url) {
  var index = isString(url) ? url.indexOf('://') : -1;
  if (index <= 0) {
    return false;
  }
  return !NO_PROTO_RE.test(url.substring(0, index));
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

function formatUrl(pattern) {
  var queryString = '';
  var queryIndex = pattern.indexOf('?');
  if (queryIndex != -1) {
    queryString = pattern.substring(queryIndex);
    pattern = pattern.substring(0, queryIndex);
  }
  var index = pattern.indexOf('://');
  index = pattern.indexOf('/', index == -1 ? 0 : index + 3);
  return (index == -1 ? pattern + '/' : pattern) + queryString;
}

exports.hasProtocol = hasProtocol;
exports.setProtocol = setProtocol;
exports.getProtocol = getProtocol;
exports.removeProtocol = removeProtocol;
exports.replaceProtocol = replaceProtocol;
exports.formatUrl = formatUrl;

var QUERY_RE = /\/[^/]*(?:\?.*)?$/;
exports.getAbsUrl = function(url, fullUrl) {
  if (HTTP_RE.test(url)) {
    return formatUrl(url);
  }
  if (url[0] === '/') {
    var index = fullUrl.indexOf('/', 8);
    url = fullUrl.substring(0, index) + url;
    return formatUrl(url);
  }
  url = fullUrl.replace(QUERY_RE, '') + '/' + url;
  return formatUrl(url);
};

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

exports.getMonth = function(time) {
  var date = new Date(time || Date.now());
  return date.getFullYear() + padLeft(date.getMonth() + 1);
};

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
      try {
        fs.writeFileSync(getLogFile(getDate()), msg + '\r\n' +  e.stack, { flag: 'a' });
      } catch (e) {}
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
  return isString(str) ? str.replace(SPEC_TAG_RE, transformTag) : str;
};

var SEP_RE_G = /^[^\n\r\S]*```+\s*$/mg;

exports.wrapRuleValue = function(key, value, size, policy) {
  if (!key || value == null) {
    return '';
  }
  if (!isString(value)) {
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
  if (data == null || Buffer.isBuffer(data)) {
    return data;
  }
  if (typeof data !== 'string') {
    try {
      data = JSON.stringify(data);
    } catch (e) {
      return;
    }
  }
  return data && Buffer.from(data);
};


function readStream(stream, callback) {
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
    stream.zlib = zlibx;
    var encoding = stream.headers && stream.headers['content-encoding'];
    var getBuffer = function(cb) {
      if (err || buf !== undefined) {
        return cb(err, buf);
      }
      zlibx.unzip(encoding, buffer, function(e, ctn) {
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
    stream._readRawBuffer_ = buffer;
    callback(buffer);
  });
}

exports.readStream = readStream;

exports.wrapReadStream = function(stream) {
  var callbacks = [];
  var rawBuffer;
  var getRawBuffer = function(callback) {
    if (rawBuffer !== undefined || !callbacks) {
      return callback(rawBuffer);
    }
    if (callbacks) {
      callbacks.push(callback);
    }
    callbacks.length === 1 && readStream(stream, function(buffer) {
      rawBuffer = buffer;
      callback(buffer);
      callbacks.forEach(function(cb) {
        cb(buffer);
      });
      callbacks = null;
    });
  };
  stream.zlib = zlibx;
  stream.getBuffer = function(callback) {
    getRawBuffer(function(buffer) {
      stream.getBuffer(callback);
    });
  };
  stream.getText = function(callback) {
    getRawBuffer(function() {
      stream.getText(callback);
    });
  };
  stream.getJson = function(callback) {
    getRawBuffer(function() {
      stream.getJson(callback);
    });
  };
  stream.getRawBuffer = getRawBuffer;
  return stream;
};

exports.readJsonSync = function(filepath) {
  try {
    return fse.readJsonSync(filepath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
  }
  try {
    return fse.readJsonSync(filepath);
  } catch (e) {}
};

function isUrl(url) {
  return HTTP_RE.test(url);
}

exports.isUrl = isUrl;

exports.getRegistry = function(registry) {
  if (!registry || !isUrl(registry) || registry.length > 1024) {
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

exports.parseAuth = function(auth) {
  var result = {};
  if (!auth) {
    return result;
  }
  auth = AUTH_RE.test(auth) ? auth.substring(6).trim() : auth;
  result.auth = auth;
  auth = Buffer.from(auth, 'base64').toString();
  var index = auth.indexOf(':');
  if (index === -1) {
    result.name = auth;
    result.pass = '';
  } else {
    result.name = auth.substring(0, index);
    result.pass = auth.substring(index + 1);
  }
  return result;
};

exports.formatHost = parseUrl.formatHost;

exports.createTransform = function() {
  return new PassThrough(STREAM_OPTS);
};

var SPEC_CHAR_RE = /[|\\{}()[\]^$+?.]/g;
var SPEC_STAR_RE = /[|\\{}()[\]^$+?*.]/g;

exports.escapeRegExp = function (str, withStar) {
  if (!str) {
    return '';
  }
  return str.replace(withStar ? SPEC_STAR_RE : SPEC_CHAR_RE, '\\$&');
};

exports.joinIpPort = function(ip, port) {
  if (!port) {
    return ip;
  }
  if (net.isIPv6(ip)) {
    ip = '[' + ip + ']';
  }
  return ip + ':' + port;
};

var TUNNEL_HOST_RE = /^[^:\/]+\.[^:\/]+:\d+$/;
var TUNNEL_IPV6_HOST_RE = /^\[[^\/]+\]:\d+$/;

exports.isTunnelHost = function(host) {
  return host && (TUNNEL_HOST_RE.test(host) || TUNNEL_IPV6_HOST_RE.test(host));
};

var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER + '';
var MIN_SAFE_INTEGER = Math.abs(Number.MIN_SAFE_INTEGER) + '';
var DIG_RE = /^([+-]?)([1-9]\d{0,15})$/;
var NUM_RE = /^(?:0|[1-9]\d*)$/;
var ARR_RE = /\[(0|[1-8]\d{0,15}|9\d{0,14})\]$/;
var DOT_RE = /(\\+)\./g;
var CR_RE = /\r/g;

function isString(str) {
  return str && typeof str === 'string';
}

exports.isString = isString;

function isSafeNumStr(str) {
  if (str == '0') {
    return true;
  }
  if (!DIG_RE.test(str)) {
    return false;
  }
  var sign = RegExp.$1 === '-';
  var num = RegExp.$2;
  if (num.length < 16) {
    return true;
  }
  return num <= (sign ? MIN_SAFE_INTEGER : MAX_SAFE_INTEGER);
}

exports.isSafeNumStr = isSafeNumStr;

function deleteProp(obj, key) {
  try {
    if (!Array.isArray(obj)) {
      delete obj[key];
      return;
    }
    if (NUM_RE.test(key)) {
      obj.splice(key, 1);
    }
  } catch (e) {}
}

exports.deleteProp = deleteProp;

// "key"
// [n]
// [key]
// k.[n]."k[n]".k[n]
function parseKey(key) {
  if (!key) {
    return key;
  }
  var first = key[0];
  var len = key.length - 1;
  var last = key[len];
  if (first === '"' && last === '"') {
    return key.substring(1, len);
  }
  var result = ARR_RE.exec(key);
  if (!result) {
    return key;
  }
  var list = [];
  while(result) {
    key = key.slice(0, -result[0].length);
    list.unshift(+result[1]);
    result = ARR_RE.exec(key);
  }
  if (key) {
    list.unshift(key);
  }
  return list;
}

function replaceDot(_, slash) {
  var len = slash.length;
  slash = slash.substring(0, Math.floor(len / 2));
  return slash + (len % 2 ? '\r' : '.');
}

function parseKeys(key) {
  if (!isString(key)) {
    return key;
  }
  key = key.trim();
  if (key.indexOf('.') === -1) {
    return parseKey(key);
  }
  key = key.replace(DOT_RE, replaceDot);
  if (key.indexOf('.') === -1) {
    return parseKey(key.replace(CR_RE, '.'));
  }
  var result = [];
  key.split('.').forEach(function(k) {
    k = parseKey(k.trim().replace(CR_RE, '.'));
    if (Array.isArray(k)) {
      result = result.concat(k);
    } else {
      result.push(k);
    }
  });
  return result;
}

exports.deleteProps = function(obj, key) {
  key = parseKeys(key);
  if (!Array.isArray(key)) {
    return deleteProp(obj, key);
  }
  var len = key.length;
  if (!len) {
    return;
  }
  if (len === 1) {
    return deleteProp(obj, key[0]);
  }
  --len;
  for (var i = 0; i <= len; i++) {
    if (!obj) {
      return;
    }
    var k = key[i];
    if (i === len) {
      return deleteProp(obj, k);
    }
    obj = obj[k];
  }
};

function replaceCrLf(char) {
  return char === '\\r' ? '\r' : '\n';
}

function parseLine(line) {
  var index = line.indexOf(': ');
  if (index === -1) {
    index = line.indexOf(':');
    if (index === -1) {
      index = line.indexOf('=');
    }
  }
  var name, value;
  if (index != -1) {
    name = line.substring(0, index).trim();
    value = line.substring(index + 1).trim();
    if (value) {
      var fv = value[0];
      var lv = value[value.length - 1];
      if (fv === lv) {
        if (fv === '"' || fv === '\'' || fv === '`') {
          value = value.slice(1, -1);
          if (value && fv === '`') {
            value = value.replace(RAW_CRLF_RE, replaceCrLf);
          }
        }
      } else if (isSafeNumStr(value)) {
        value = parseInt(value, 10);
      }
    }
  } else {
    name = line.trim();
    value = '';
  }
  return {
    name: name,
    value: value
  };
}

function isNum(n) {
  return typeof n === 'number';
}

exports.parsePlainText = function (text, resolveKeys) {
  var result;
  text.split(LINE_END_RE).forEach(function(line) {
    if (!(line = line.trim())) {
      return;
    }
    var obj = parseLine(line);
    var name = obj.name;
    if (resolveKeys) {
      name = parseKeys(obj.name);
    }
    var value = obj.value;
    var isKey = !Array.isArray(name);
    if (isKey || name.length <= 1) {
      if (isKey) {
        result = result || {};
      } else {
        name = name[0];
        result = result || [];
      }
      result[name] = value;
      return;
    }
    result = result || (isNum(name[0]) ? [] : {});
    obj = result;
    var lastIndex = name.length - 1;
    name.forEach(function(key, i) {
      if (i === lastIndex) {
        obj[key] = value;
        return;
      }
      var next = obj[key];
      if (!next || typeof next !== 'object') {
        next = isNum(name[i + 1]) ? [] : {};
      }
      obj[key] = next;
      obj = next;
    });
  });
  return result || {};
};

exports.isWhistleName = function(name) {
  return /^[\w.-]{1,30}$/.test(name);
};

var HTTP_PORT_RE = /:80$/;
var HTTPS_PORT_RE = /:443$/;

function removeDefaultPort(host, isHttps) {
  return host && host.replace(isHttps ? HTTPS_PORT_RE : HTTP_PORT_RE, '');
}

function getFullUrl(req) {
  var headers = req.headers;
  var host = headers[REAL_HOST_HEADER];
  if (hasProtocol(req.url)) {
    var options = parseUrl(req.url);
    if (
      options.protocol === 'https:' ||
      (req.isWs && options.protocol === 'wss:')
    ) {
      req.isHttps = true;
    }
    req.url = options.path;
    if (options.host) {
      headers.host = options.host;
    }
  } else {
    req.url = req.url || '/';
    if (req.url[0] !== '/') {
      req.url = '/' + req.url;
    }
  }
  if (host) {
    delete headers[REAL_HOST_HEADER];
  }
  if (!isString(host)) {
    host = headers.host;
    if (typeof host !== 'string') {
      host = headers.host = '';
    }
  } else if (headers.host !== host) {
    if (isString(headers.host)) {
      req._fwdHost = headers.host;
    }
    headers.host = host;
  }
  host = removeDefaultPort(host, req.isHttps);
  var fullUrl = host + req.url;
  if (req.isWs) {
    return (req.isHttps ? 'wss://' : 'ws://') + fullUrl;
  }
  return (req.isHttps ? 'https://' : 'http://') + fullUrl;
}

exports.getFullUrl = getFullUrl;

function getReqOptions(req, port, host) {
  var options = parseUrl(getFullUrl(req));
  options.headers = req.headers;
  options.method = req.method;
  options.agent = false;
  options.protocol = null;
  options.host = host || LOCALHOST;
  if (port > 0) {
    options.port = port;
  }
  options.hostname = null;
  return options;
}

exports.getReqOptions = getReqOptions;

exports.forwardRequest = function(req, res, port, host) {
  var options = getReqOptions(req, port, host);
  var destroyed;
  var abort = function () {
    if (!destroyed) {
      destroyed = true;
      client.destroy();
    }
  };
  var client = http.request(options, function (_res) {
    res.writeHead(_res.statusCode, _res.headers);
    _res.pipe(res);
  });
  req.on('error', abort);
  res.on('error', abort);
  res.once('close', abort);
  client.on('error', function (err) {
    abort();
    res.emit('error', err);
  });
  req.pipe(client);
  return client;
};

exports.setInternalOptions = function (options, config, isInternal) {
  if ((options.url || options.uri) && !options.pluginName) {
    options.headers = options.headers || {};
    options.headers[config.PROXY_ID_HEADER] = isInternal ? 'internal' : 'internalx';
    options.whistleConfig = {
      host: config.host || LOCALHOST,
      port: config.port
    };
  }
  return options;
};

exports.createHash = function (str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str || '');
  return shasum.digest('hex');
};

var VER_LEN = 3;

function compareVer(n1, n2, index) {
  n1 = parseInt(n1, 10) || 0;
  n2 = parseInt(n2, 10) || 0;
  if (n1 === n2) {
    return 0;
  }
  return n1 > n2 ? VER_LEN - index : index - VER_LEN;
}

exports.compareVersion = function(v1, v2) {
  if (v1 === v2 || !v1 || typeof v1 !== 'string') {
    return 0;
  }
  if (!v2 || typeof v2 !== 'string') {
    return 3;
  }
  v1 = v1.split('.');
  v2 = v2.split('.');

  for (var i = 0; i < 3; i++) {
    var flag = compareVer(v1[i], v2[i], i);
    if (flag) {
      return Math.max(flag, 0);
    }
  }
  v1 = v1[2];
  v2 = v2[2];
  if (!v1 || !v2) {
    return 0;
  }
  var i1 = v1.indexOf('-');
  var i2 = v2.indexOf('-');
  var test1 = i1 === -1 ? '' : v1.substring(i1);
  var test2 = i2 === -1 ? '' : v2.substring(i2);
  if (test1 === test2) {
    return 0;
  }
  if (!test1 || !test2) {
    return test1 ? 0 : 1;
  }
  return test1 > test2 ? 1 : 0;
};

exports.upperFirst = function(str) {
  return isString(str) ? str[0].toUpperCase() + str.substring(1) : '';
};

exports.readWhistleRc = function(options) {
  options = options || {};
  if (options.rcPath === 'none') {
    return;
  }
  var rcPath = options.rcPath || path.join(getHomedir(), '.whistlerc');
  var rcText = (readFileTextSync(rcPath, true, UTF8_OPTIONS) || '').trim();
  if (!rcText) {
    return;
  }
  var storage = options.storage ? options.storage + '.' : '';
  var wildcard = '*.';
  var result;
  rcText.split(LINE_END_RE).forEach(function(line) {
    if (!(line = line.trim()) || line[0] === '#') {
      return;
    }
    var index = line.indexOf(': ');
    if (index === -1) {
      index = line.indexOf('=');
    }
    if (index != -1) {
      var name = line.substring(0, index).trim();
      var value = name && line.substring(index + 1).trim();
      if (value) {
        if (name.indexOf(storage) !== 0) {
          if (name.indexOf(wildcard) !== 0) {
            return;
          }
          name = name.substring(wildcard.length);
        } else {
          name = name.substring(storage.length);
        }
        if (value[0] === '"' && value[value.length - 1] === '"') {
          value = value.slice(1, -1);
        }
        result = result || {};
        result[name] = value;
      }
    }
  });
  return result;
};

var GZIP_RE = /\bgzip\b/i;
var canGzip = function (req) {
  return GZIP_RE.test(req.headers['accept-encoding']);
};

function sendGzipData(res, headers, buffer) {
  if (headers) {
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = buffer.length;
    res.writeHead(200, headers);
    res.end(buffer);
  } else {
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}

exports.sendGzip = function (req, res, data) {
  if (!canGzip(req)) {
    return res.json(data);
  }
  var str = JSON.stringify(data);
  if (str.length < GZIP_THRESHOLD) {
    return res.json(data);
  }
  gzip(str, function(err, result) {
    if (err) {
      try {
        res.json(data);
      } catch (e) {
        res.status(500).send('Internal Server Error');
      }
      return;
    }
    sendGzipData(res, {
      'Content-Type': 'application/json; charset=utf-8'
    }, result);
  });
};

exports.sendGzipText = function(req, res, headers, text, gzipText) {
  if (!text || !canGzip(req) || (!gzipText && text.length < GZIP_THRESHOLD)) {
    headers && res.writeHead(200, headers);
    return headers ? res.end(text) : res.send(text);
  }
  if (gzipText) {
    return sendGzipData(res, headers, gzipText);
  }
  gzip(text, function(err, result) {
    if (err) {
      headers && res.writeHead(200, headers);
      return headers ? res.end(text) : res.send(text);
    }
    sendGzipData(res, headers, result);
  });
};

exports.checkHistory = function(data) {
  if (
    typeof data.url === 'string' &&
    typeof data.method === 'string' &&
    typeof data.headers === 'string'
  ) {
    data.url = data.url.trim();
    data.headers = data.headers.trim();
    data.method = data.method.trim();
    if (!data.body) {
      data.body = '';
      return true;
    }
    return typeof data.body === 'string';
  }
};

var TLSV2_CIPHERS = ['DHE-RSA-AES256-GCM-SHA384',
                      'DHE-RSA-AES128-GCM-SHA256',
                      'AES256-GCM-SHA384',
                      'ECDHE-ECDSA-AES256-GCM-SHA384'].join(':');
var TLS_OPTIONS = { ciphers: TLSV2_CIPHERS };

function getTlsOptions(rules) {
  var cipher = rules && rules.cipher;
  var opts = cipher && cipher.__tlsOptions;
  opts = opts && opts._opts;
  if (!opts) {
    return TLS_OPTIONS;
  }
  if (!opts.ciphers) {
    opts.ciphers = TLSV2_CIPHERS;
  }
  return opts;
}

exports.getTlsOptions = getTlsOptions;

function toLowerCase(str) {
  return typeof str == 'string' ? str.trim().toLowerCase() : str;
}

exports.toLowerCase = toLowerCase;

function getContentEncoding(headers) {
  var encoding = toLowerCase(
    (headers && headers['content-encoding']) || headers
  );
  return encoding === 'gzip' || (supportsBr && encoding === 'br') ||
    encoding === 'deflate' ? encoding : null;
}

exports.getContentEncoding = getContentEncoding;


function getUnzipStream(headers) {
  switch (getContentEncoding(headers)) {
  case 'gzip':
    return zlib.createGunzip();
  case 'br':
    return supportsBr && zlib.createBrotliDecompress();
  case 'deflate':
    return zlib.createInflate();
  }
}

exports.getUnzipStream = getUnzipStream;

var G_NON_LATIN1_RE = /\s|[^\x00-\xFF]/gu;

function safeEncodeURIComponent(ch) {
  try {
    return encodeURIComponent(ch);
  } catch (e) {}

  return ch;
}

exports.safeEncodeURIComponent = safeEncodeURIComponent;

/**
 * 解析一些字符时，encodeURIComponent可能会抛异常，对这种字符不做任何处理
 * see: http://stackoverflow.com/questions/16868415/encodeuricomponent-throws-an-exception
 * @param ch
 * @returns
 */
exports.encodeNonLatin1Char = function (str) {
  if (!isString(str)) {
    return '';
  }
  return str.replace(G_NON_LATIN1_RE, safeEncodeURIComponent);
};

function toUpperCase(str) {
  return typeof str == 'string' ? str.trim().toUpperCase() : str;
}

exports.toUpperCase = toUpperCase;

var CHARSET_RE = /charset=([\w-]+)/i;

function getCharset(str) {
  var charset;
  if (CHARSET_RE.test(str)) {
    charset = RegExp.$1;
    if (!iconv.encodingExists(charset)) {
      return;
    }
  }

  return charset;
}

exports.getCharset = getCharset;

function toBuffer(buf, charset) {
  if (buf == null || Buffer.isBuffer(buf)) {
    return buf;
  }
  if (typeof buf === 'object') {
    try {
      buf = JSON.stringify(buf);
    } catch (e) {}
  } else {
    buf = String(buf);
  }
  if (!buf) {
    return;
  }
  if (charset && typeof charset === 'string' && !UTF8_RE.test(charset)) {
    try {
      charset = charset.toLowerCase();
      if (charset === 'base64') {
        return Buffer.from(buf, 'base64');
      }
      return iconv.encode(buf, charset);
    } catch (e) {}
  }
  return Buffer.from(buf);
}

exports.toBuffer = toBuffer;

function hasRequestBody(req) {
  req = typeof req == 'string' ? req : req.method;
  if (typeof req != 'string') {
    return false;
  }

  req = req.toUpperCase();
  return !(
    req === 'GET' ||
    req === 'HEAD' ||
    req === 'OPTIONS' ||
    req === 'CONNECT'
  );
}

exports.hasRequestBody = hasRequestBody;

function getMethod(method) {
  if (typeof method !== 'string') {
    return 'GET';
  }
  return method.trim().toUpperCase() || 'GET';
}

exports.getMethod = getMethod;

function evalJson(str) {
  try {
    return json5.parse(str);
  } catch (e) {}
}

exports.parseRawJson = evalJson;

var CRLF_RE = /\r\n|\r|\n/g;

function parseHeaders(headers, rawNames) {
  if (typeof headers == 'string') {
    headers = headers.split(CRLF_RE);
  }
  var _headers = {};
  headers.forEach(function (line) {
    var index = line.indexOf(':');
    var value;
    if (index != -1) {
      value = line.substring(index + 1).trim();
      var rawName = line.substring(0, index).trim();
      var name = rawName.toLowerCase();
      var list = _headers[name];
      if (rawNames) {
        rawNames[name] = rawName;
      }
      if (list) {
        if (!Array.isArray(list)) {
          _headers[name] = list = [list];
        }
        list.push(value);
      } else {
        _headers[name] = value;
      }
    }
  });

  return lowerCaseify(_headers);
}

exports.parseHeaders = parseHeaders;


function isCiphersError(e) {
  var c = e.code;
  return (
    c === 'EPROTO' || c === 'ERR_SSL_BAD_ECPOINT' || c === 'ERR_SSL_VERSION_OR_CIPHER_MISMATCH' ||
    String(e.message).indexOf('disconnected before secure TLS connection was established') !== -1
  );
}

exports.isCiphersError = isCiphersError;

exports.connect = function (options, callback) {
  var socket, timer, done, retry;
  var execCallback = function (err) {
    clearTimeout(timer);
    timer = null;
    if (!done) {
      done = true;
      err ? callback(err) : callback(null, socket);
    }
  };
  var handleConnect = function () {
    execCallback();
  };
  var handleError = function (err) {
    if (done) {
      return;
    }
    socket.removeAllListeners();
    socket.on('error', noop);
    socket.destroy(err);
    clearTimeout(timer);
    if (retry) {
      return execCallback(err);
    }
    retry = true;
    timer = setTimeout(handleTimeout, 12000);
    try {
      if (options.ALPNProtocols && err && isCiphersError(err)) {
        extend(options, getTlsOptions(options._rules));
      }
      socket = sockMgr.connect(options, handleConnect);
    } catch (e) {
      return execCallback(e);
    }
    socket.on('error', handleError);
    socket.on('close', function (err) {
      !done && execCallback(err || new Error('closed'));
    });
  };
  var handleTimeout = function () {
    handleError(TIMEOUT_ERR);
  };
  var sockMgr = options.ALPNProtocols ? tls : net;
  timer = setTimeout(handleTimeout, 6000);
  try {
    socket = sockMgr.connect(options, handleConnect);
  } catch (e) {
    return execCallback(e);
  }
  socket.on('error', handleError);
};

function getRemotePort(req, config) {
  try {
    var socket = req.socket || req;
    if (socket._remotePort == null) {
      var port = req.headers && req.headers[config.REMOTE_PORT_HEAD];
      if (port) {
        delete req.headers[config.REMOTE_PORT_HEAD];
      } else {
        port = socket.remotePort;
      }
      socket._remotePort = port > 0 ? port : '0';
    }
    return socket._remotePort;
  } catch (e) {}
  return 0;
}

exports.getRemotePort = getRemotePort;

exports.getClientPort = function (req, config) {
  var headers = req.headers || {};
  var port = headers[config.CLIENT_PORT_HEAD];
  if (port > 0) {
    return port;
  }
  return getRemotePort(req, config);
};

function isLocalIp(ip) {
  if (!isString(ip)) {
    return true;
  }
  return ip.length < 7 || ip === LOCALHOST;
}

exports.isLocalIp = isLocalIp;

function setRawHeader(headers, name, value) {
  var keys = Object.keys(headers);
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i];
    if (key.toLowerCase() === name) {
      headers[key] = value;
      return;
    }
  }
  headers[name] = value;
}

exports.setRawHeader = setRawHeader;

function getTunnelPath(headers) {
  var host = headers.host || headers.Host;
  if (host) {
    return host;
  }
  var keys = Object.keys(headers);
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i];
    if (key.toLowerCase() === 'host') {
      return headers[key];
    }
  }
}

exports.connectInner = function (options, cb, config) {
  var headers = options.headers || {};
  var proxyOptions = {
    method: 'CONNECT',
    agent: false,
    proxyTunnelPath: options.proxyTunnelPath,
    enableIntercept: options.enableIntercept,
    path: getTunnelPath(headers),
    host: options.proxyHost,
    port: options.proxyPort,
    rejectUnauthorized: config.rejectUnauthorized,
    headers: headers
  };
  var httpModule = http;
  if (options.proxyServername) {
    proxyOptions.servername = options.proxyServername;
    httpModule = https;
  }
  var auth = options.proxyAuth || options.auth;
  if (auth) {
    auth = Buffer.isBuffer(auth) ? auth : Buffer.from(auth + '');
    auth = 'Basic ' + auth.toString('base64');
    setRawHeader(headers, 'proxy-authorization', auth);
  }
  var timer = setTimeout(function () {
    if (req) {
      req.emit('error', TIMEOUT_ERR);
      req.destroy();
      req.socket && req.socket.destroy();
    }
  }, CONN_TIMEOUT);
  var req = httpModule.request(proxyOptions);
  req.on('error', noop);
  req
    .on('connect', function (res, socket) {
      clearTimeout(timer);
      socket.on('error', noop);
      if (res.statusCode !== 200) {
        var err = new Error(
          'Tunneling socket could not be established, statusCode=' +
            res.statusCode
        );
        err.statusCode = res.statusCode;
        socket.destroy();
        process.nextTick(function () {
          req.emit('error', err);
        });
        return;
      }
      if (res.headers['x-whistle-allow-tunnel-ack']) {
        socket.write('1');
      }
      cb(socket, res);
    })
    .end();
  return req;
};


// AES 加密
exports.encryptAES = function (text, secretKey, salt) {
  var key = crypto.scryptSync(secretKey, salt || '5b6af7b9884e1165', 32);
  var iv = crypto.randomBytes(16);
  var cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  var encrypted = cipher.update(text, 'utf8', 'hex');
  return iv.toString('hex') + '\n' + encrypted + cipher.final('hex');
};

// AES 解密
exports.decryptAES = function (text, secretKey, salt) {
  text = text.split('\n');
  if (text.length !== 2) {
    throw new Error('Invalid encrypted text');
  }
  var key = crypto.scryptSync(secretKey, salt || '5b6af7b9884e1165', 32);
  var iv = Buffer.from(text[0], 'hex');
  var decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  var decrypted = decipher.update(text[1], 'hex', 'utf8');
  return decrypted + decipher.final('utf8');
};

function getStat(filepath, callback) {
  fs.stat(filepath, function (err, stat) {
    if (stat) {
      return callback(err, stat);
    }
    if (err && err.code === 'ENOENT') {
      return callback(err);
    }
    fs.stat(filepath, callback);
  });
}
exports.getStat = getStat;

exports.getStatSync = function (filepath) {
  try {
    return fs.statSync(filepath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
  }
  try {
    return fs.statSync(filepath);
  } catch (e) {}
};
