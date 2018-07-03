var http = require('http');
var https = require('https');
var url = require('url');
var path = require('path');
var os = require('os');
var fs = require('fs');
var vm = require('vm');
var net = require('net');
var EventEmitter = require('events').EventEmitter;
var fse = require('fs-extra2');
var qs = require('querystring');
var extend = require('extend');
var PassThrough = require('stream').PassThrough;
var iconv = require('iconv-lite');
var zlib = require('zlib');
var PipeStream = require('pipestream');
var Q = require('q');
var Buffer = require('safe-buffer').Buffer;
var protoMgr = require('../rules/protocols');
var protocols = protoMgr.protocols;
var logger = require('./logger');
var config = require('../config');
var isUtf8 = require('./is-utf8');
var fileWriterCache = {};
var CRLF_RE = /\r\n|\r|\n/g;
var UTF8_OPTIONS = {encoding: 'utf8'};
var MAX_RULES_SIZE = 1024 * 1024 * 256;
var MAX_BODY_LENGTH = MAX_RULES_SIZE * 24;
var REQUEST_TIMEOUT = 5000;
var COMMON_TIMEOUT = 20000;
var LOCALHOST = '127.0.0.1';
var aliasProtocols = protoMgr.aliasProtocols;
var CONTEXT = vm.createContext();
var SCRIPT_BODY = 'function parse(str) {var fn = new Function("return " + str); return fn();}; parse;';
var EVAL_SCRIPT = new vm.Script(SCRIPT_BODY);
var END_WIDTH_SEP_RE = /[/\\]$/;
var JSON_RE = /^\s*(?:\{[\w\W]*\}|\[[\w\W]*\])\s*$/;
var JSON_VM_OPTIONS = {
  displayErrors: false,
  timeout: 10
};
var UTF8_RE = /^utf-?8$/i;
var PROXY_RE = /^x?(?:socks|http-proxy|proxy)$/;
var DEFAULT_REGISTRY = 'https://registry.npmjs.org';
var HTTP_RE = /^(https?:\/\/[^/]+)/;
var ctxTimer;
var resetContext = function() {
  ctxTimer = null;
  CONTEXT = vm.createContext();
};

exports.isWin = process.platform === 'win32';
exports.isUtf8 = isUtf8;
exports.WhistleTransform = require('./whistle-transform');
exports.ReplacePatternTransform = require('./replace-pattern-transform');
exports.ReplaceStringTransform = require('./replace-string-transform');
exports.SpeedTransform = require('./speed-transform');
exports.FileWriterTransform = require('./file-writer-transform');
exports.getServer = require('hagent').getServer;
exports.parseUrl = require('./parse-url');

function noop() {}

exports.noop = noop;

function evalJson(str) {
  if (!JSON_RE.test(str)) {
    return;
  }
  try {
    var parse = EVAL_SCRIPT.runInContext(CONTEXT, JSON_VM_OPTIONS);
    return parse(str);
  } catch(e) {} finally {
    clearContext();
  }
}

exports.parseRawJson = function(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return evalJson(str);
  }
};

exports.getRegistry = function(pkg) {
  var resolved = pkg._resolved;
  if (!resolved || !HTTP_RE.test(resolved)) {
    return;
  }
  resolved = RegExp.$1;
  return resolved === DEFAULT_REGISTRY ? undefined : resolved;
};

var ESTABLISHED_CTN = 'HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n';
exports.setEstablished = function(socket) {
  socket.write(ESTABLISHED_CTN);
};

function listenerCount(emitter, eventName) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(eventName);
  }
  return EventEmitter.listenerCount(emitter, eventName);
}

exports.listenerCount = listenerCount;

function changePort(url, port) {
  var index = url.indexOf('/', url.indexOf('://') + 3);
  if (index != -1) {
    var host = url.substring(0, index).replace(/:\d*$/, '');
    url = host + ':' + port + url.substring(index);
  }
  return url;
}

exports.changePort = changePort;

function handleStatusCode(statusCode, headers) {
  if (statusCode == 401) {
    headers['www-authenticate'] = 'Basic realm=User Login';
  }
  return headers;
}

exports.handleStatusCode = handleStatusCode;

function getStatusCode(statusCode) {
  statusCode |= 0;
  return (statusCode < 100 || statusCode > 999) ? 0 : statusCode;
}

exports.getStatusCode = getStatusCode;

var scriptCache = {};
var VM_OPTIONS = {
  displayErrors: false,
  timeout: 60
};
var MAX_SCRIPT_SIZE = 1024 * 256;
var MAX_SCRIPT_CACHE_COUNT = 64;
var MIN_SCRIPT_CACHE_COUNT = 32;

function getScript(content) {
  content = content.trim();
  var len = content.length;
  if (!len || len > MAX_SCRIPT_SIZE) {
    return;
  }

  var script = scriptCache[content];
  delete scriptCache[content];

  var list = Object.keys(scriptCache);
  if (list.length > MAX_SCRIPT_CACHE_COUNT) {
    list = list.map(function(content) {
      var script = scriptCache[content];
      script.content = content;
      return script;
    }).sort(function(a, b) {
      return a.time > b.time ? -1 : 1;
    }).splice(0, MIN_SCRIPT_CACHE_COUNT);

    scriptCache = {};
    list.forEach(function(script) {
      scriptCache[script.content] = {
        script: script.script,
        time: script.time
      };
    });
  }

  script = scriptCache[content] = script || {
    script: new vm.Script('(function(){\n' + content + '\n})()')
  };
  script.time = Date.now();

  return script.script;
}

function clearContext() {
  Object.keys(CONTEXT).forEach(function(key) {
    delete CONTEXT[key];
  });
  if (!ctxTimer) {
    ctxTimer = setTimeout(resetContext, 30000);
  }
}

function execScriptSync(script, context) {
  try {
    if (script = getScript(script)) {
      CONTEXT.console = {};
      ['fatal', 'error', 'warn', 'info', 'log', 'debug']
        .forEach(function(level) {
          CONTEXT.console[level] = logger[level];
        });
      Object.keys(context).forEach(function(key) {
        CONTEXT[key] = context[key];
      });
      script.runInContext(CONTEXT, VM_OPTIONS);
    }
    return true;
  } catch(e) {
    logger.error(e);
  } finally {
    clearContext();
  }
}

exports.execScriptSync = execScriptSync;

function getFileWriter(file, callback) {
  if (!file || fileWriterCache[file]) {
    return callback();
  }

  var execCallback = function(writer) {
    delete fileWriterCache[file];
    callback(writer);
  };

  fs.stat(file, function(err, stat) {
    if (!err) {
      return execCallback();
    }
    logger.warn(err);
    fse.ensureFile(file, function(err) {
      execCallback(err ? null : fs.createWriteStream(file).on('error', logger.error));
      logger.error(err);
    });
  });
}

exports.getFileWriter = getFileWriter;

function getFileWriters(files, callback) {
  if (!Array.isArray(files)) {
    files = [files];
  }

  Q.all(files.map(function(file) {
    var defer = Q.defer();
    getFileWriter(file, function(writer) {
      defer.resolve(writer);
    });
    return defer.promise;
  })).spread(callback);
}

exports.getFileWriters = getFileWriters;

function clone(obj) {
  if (!obj || typeof obj != 'object') {
    return obj;
  }

  var result = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(function(name) {
    result[name] = clone(obj[name]);
  });

  return result;
}

exports.clone = clone;

function toBuffer(buf, charset) {
  if (buf == null || Buffer.isBuffer(buf)) {
    return buf;
  }
  buf += '';
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

exports.mkdir = function mkdir(path) {
  !fs.existsSync(path) && fs.mkdirSync(path);
  return path;
};

function getErrorStack(err) {
  if (!err) {
    return '';
  }

  var stack;
  try {
    stack = err.stack;
  } catch(e) {}
  stack = stack || err.message || err;
  var result = [
    'From: ' + config.name + '@' + config.version,
    'Node: ' + process.version,
    'Date: ' + formatDate(),
    stack];
  return result.join('\r\n');
}

exports.getErrorStack = getErrorStack;

function formatDate(now) {
  now = now || new Date();
  return now.toLocaleString();
}

exports.formatDate = formatDate;

var REG_EXP_RE = /^\/(.+)\/(i)?$/;

exports.isRegExp = function isRegExp(regExp) {
  return REG_EXP_RE.test(regExp);
};

var ORIG_REG_EXP = /^\/(.+)\/([igm]{0,3})$/;

exports.isOriginalRegExp = function isOriginalRegExp(regExp) {
  if (!ORIG_REG_EXP.test(regExp) || /[igm]{2}/.test(regExp.$2)) {
    return false;
  }

  return true;
};

exports.toOriginalRegExp = function toRegExp(regExp) {
  regExp = ORIG_REG_EXP.test(regExp);
  try {
    regExp = regExp && new RegExp(RegExp.$1, RegExp.$2);
  } catch(e) {
    regExp = null;
  }
  return regExp;
};

exports.emitError = function(obj, err) {
  if (obj) {
    obj.once('error', noop);
    obj.emit('error', err || new Error('Unknown'));
  }
};

exports.indexOfList = function(buf, subBuf, start) {
  start = start || 0;
  if (buf.indexOf) {
    return buf.indexOf(subBuf, start);
  }

  var subLen = subBuf.length;
  if (subLen) {
    for (var i = start, len = buf.length - subLen; i <= len; i++) {
      var j = 0;
      for (; j < subLen; j++) {
        if (subBuf[j] !== buf[i + j]) {
          break;
        }
      }
      if (j == subLen) {
        return i;
      }
    }
  }

  return -1;
};

exports.startWithList = function(buf, subBuf, start) {
  var len = subBuf.length;
  if (!len) {
    return false;
  }

  start = start || 0;
  for (var i = 0; i < len; i++) {
    if (buf[i + start] != subBuf[i]) {
      return false;
    }
  }

  return true;
};

exports.endWithList = function(buf, subBuf, end) {
  var subLen = subBuf.length;
  if (!subLen) {
    return false;
  }
  if (!(end >= 0)) {
    end = buf.length - 1;
  }

  for (var i = 0; i < subLen; i++) {
    if (subBuf[subLen - i - 1] != buf[end - i]) {
      return false;
    }
  }

  return true;
};

exports.getHost = function parseHost(_url) {
  _url = url.parse(setProtocol(_url || '')).hostname;
  return _url && _url.toLowerCase();
};

exports.setTimeout = function(callback) {
  var timeout = parseInt(config.timeout, 10);
  return setTimeout(callback, timeout > 0 ? timeout : 36000);
};

exports.toRegExp = function toRegExp(regExp) {
  regExp = REG_EXP_RE.test(regExp);
  try {
    regExp = regExp && new RegExp(RegExp.$1, RegExp.$2);
  } catch(e) {
    regExp = null;
  }
  return regExp;
};

function getFullUrl(req) {
  var host = req.headers.host;
  if (hasProtocol(req.url)) {
    var options = url.parse(req.url);
    req.url = options.path;
    if (options.host) {
      host = req.headers.host = options.host;
    }
  } else if (typeof host !== 'string') {
    host = req.headers.host = '';
  }
  if (host) {
    host = host.replace(req.isHttps ? /:443$/ : /:80$/, '');
  }
  return _getProtocol(req.isHttps) + host + req.url;
}
exports.getFullUrl = getFullUrl;

function setProtocol(url, isHttps) {
  return hasProtocol(url) ? url : _getProtocol(isHttps) + url;
}

function _getProtocol(isHttps) {
  return isHttps ? 'https://' : 'http://';
}

function hasProtocol(url) {
  return /^[a-z0-9.-]+:\/\//i.test(url);
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

function disableCSP(headers) {
  delete headers['content-security-policy'];
  delete headers['content-security-policy-report-only'];
  delete headers['x-content-security-policy'];
  delete headers['x-content-security-policy-report-only'];
  delete headers['x-webkit-csp'];
}

exports.disableCSP = disableCSP;

var interfaces = os.networkInterfaces();
var hostname = os.hostname();
var addressList = [];

(function updateSystyemInfo () {
  interfaces = os.networkInterfaces();
  hostname = os.hostname();
  addressList = [];
  for (var i in interfaces) {
    var list = interfaces[i];
    if (Array.isArray(list)) {
      list.forEach(function(info) {
        addressList.push(info.address.toLowerCase());
      });
    }
  }
  setTimeout(updateSystyemInfo, 30000);
})();

function networkInterfaces() {
  return interfaces;
}

function getHostname() {
  return hostname;
}

exports.networkInterfaces = networkInterfaces;
exports.hostname = getHostname;

function isLocalAddress(address) {
  if (isLocalIp(address)) {
    return true;
  }
  if (address == '0:0:0:0:0:0:0:1') {
    return true;
  }
  return addressList.indexOf(address.toLowerCase()) !== -1;
}

exports.isLocalAddress = isLocalAddress;

exports.drain = function drain(stream, endHandler) {
  var emitEndStream = new PassThrough();
  emitEndStream.on('data', noop).on('error', noop);
  typeof endHandler == 'function' && emitEndStream.on('end', endHandler);
  stream.pipe(emitEndStream);
};

exports.encodeNonAsciiChar = function encodeNonAsciiChar(str) {
  if (!str || typeof str != 'string') {
    return '';
  }
  /*eslint no-control-regex: "off"*/
  return  str && str.replace(/[^\x00-\x7F]/g, safeEncodeURIComponent);
};

/**
* 解析一些字符时，encodeURIComponent可能会抛异常，对这种字符不做任何处理
* http://stackoverflow.com/questions/16868415/encodeuricomponent-throws-an-exception
* @param ch
* @returns
*/
function safeEncodeURIComponent(ch) {
  try {
    return encodeURIComponent(ch);
  } catch(e) {}

  return ch;
}

exports.encodeURIComponent = safeEncodeURIComponent;

function getPath(url, noProtocol) {
  if (url) {
    url = url.replace(/\/?[?#].*$/, '');
    var index = noProtocol ? -1 : url.indexOf('://');
    url = index > -1 ? url.substring(index + 3) : url;
  }

  return url;
}

exports.getPath = getPath;

function getFilename(url) {
  if (typeof url == 'string' && (url = getPath(url).trim())) {
    var index = url.lastIndexOf('/');
    if (index != -1) {
      url = url.substring(index + 1);
    } else {
      url = null;
    }
  } else {
    url = null;
  }

  return url || 'index.html';
}

exports.getFilename = getFilename;

function disableReqCache(headers) {
  delete headers['if-modified-since'];
  delete headers['if-none-match'];
  delete headers['last-modified'];
  delete headers.etag;

  headers['pragma'] = 'no-cache';
  headers['cache-control'] = 'no-cache';
}

exports.disableReqCache = disableReqCache;

function disableResStore(headers) {
  headers['cache-control'] = 'no-store';
  headers['expires'] = new Date(Date.now() - 60000000).toGMTString();
  headers['pragma'] = 'no-cache';
  delete headers.tag;
}

exports.disableResStore = disableResStore;

function wrapResponse(res) {
  var passThrough = new PassThrough();
  passThrough.statusCode = res.statusCode;
  passThrough.rawHeaderNames = res.rawHeaderNames;
  passThrough.headers = lowerCaseify(res.headers);
  passThrough.trailers = lowerCaseify(res.trailers);
  passThrough.headers.server = config.name;
  res.body != null && passThrough.push(String(res.body));
  passThrough.push(null);
  return passThrough;
}

exports.wrapResponse = wrapResponse;

function wrapGatewayError(body) {
  return wrapResponse({
    statusCode: 502,
    headers: {
      'content-type': 'text/html; charset=utf8'
    },
    body: body ? '<pre>\n' + body + '\n\n\n<a href="javascript:;" onclick="location.reload()"'
      + '>Reload page</a>\n</pre>' : ''
  });
}

exports.wrapGatewayError = wrapGatewayError;

function sendStatusCodeError(cltRes, svrRes) {
  delete svrRes.headers['content-length'];
  cltRes.writeHead(502, svrRes.headers);
  cltRes.src(wrapGatewayError('Invalid status code: ' + svrRes.statusCode));
}
exports.sendStatusCodeError = sendStatusCodeError;

function parseInlineJSON(text, isValue) {
  if (/\s/.test(text) || (!isValue && (/\\|\//.test(text) && !/^&/.test(text)))) {
    return;
  }

  return qs.parse(text);
}

function parseLinesJSON(text) {
  if (!text || typeof text != 'string'
|| !(text = text.trim()) || /^[\{\[]/.test(text)) {
    return null;
  }
  var obj = {};
  text.split(/\r\n|\n|\r/g).forEach(function(line) {
    if (line = line.trim()) {
      var index = line.indexOf(': ');
      if (index === -1) {
        index = line.indexOf(':');
      }
      var name, value;
      if (index != -1) {
        name = line.substring(0, index).trim();
        value = line.substring(index + 1).trim();
      } else {
        name = line.trim();
        value = '';
      }
      var list = obj[name];
      if (list == null) {
        obj[name] = value;
      } else {
        if (!Array.isArray(list)) {
          obj[name] = list = [list];
        }
        list.push(value);
      }
    }
  });
  return obj;
}

function parseJSON(data) {

  return _parseJSON(data, true) || parseLinesJSON(data);
}

function _parseJSON(data, isValue) {
  if (typeof data != 'string' || !(data = data.trim())) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch(e) {
    var result = evalJson(data);
    if (result) {
      return result;
    }
  }

  return parseInlineJSON(data, isValue);
}

exports.parseJSON = parseJSON;

function readFiles(files, callback) {
  if (!Array.isArray(files)) {
    files = [files];
  }

  Q.all(files.map(function(file) {
    var defer = Q.defer();
    if (file && typeof file == 'string') {
      fs.readFile(file, UTF8_OPTIONS, function(err, data) {
        defer.resolve(err ? null : data);
        logger.error(err);
      });
    } else {
      defer.resolve();
    }
    return defer.promise;
  })).spread(callback);
}

exports.readFiles = readFiles;

function readFileSync(file) {
  try {
    return fs.readFileSync(file, UTF8_OPTIONS);
  } catch(e) {}
}

exports.readFileSync = readFileSync;

function trim(text) {
  return text && text.trim();
}

exports.trim = trim;

function readInjectFiles(data, callback) {
  if (!data) {
    return callback();
  }

  readFiles([data.prepend, data.replace, data.append], function(top, body, bottom) {
    if (top != null) {
      data.top = top;
    }
    if (body != null) {
      data.body = body;
    }
    if (bottom != null) {
      data.bottom = bottom;
    }
    callback(data);
  });
}

exports.readInjectFiles = readInjectFiles;

function lowerCaseify(obj, rawNames) {
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
}

exports.lowerCaseify = lowerCaseify;

function parseHeaders(headers, rawNames) {
  if (typeof headers == 'string') {
    headers = headers.split(CRLF_RE);
  }
  var _headers = {};
  headers.forEach(function(line) {
    var index = line.indexOf(':');
    var value;
    if (index != -1 && (value = line.substring(index + 1).trim())) {
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

var QUERY_PARAM_RE = /^[\w$-]+=/;
function parseRuleJson(rules, callback) {
  if (!Array.isArray(rules)) {
    rules = [rules];
  }

  Q.all(rules.map(function(rule) {
    var defer = Q.defer();
    var value = rule && removeProtocol(getMatcher(rule), true);
    var json = value && _parseJSON(value, QUERY_PARAM_RE.test(value));
    if (json) {
      defer.resolve(json);
    } else {
      _getRuleValue(rule, function(data) {
        defer.resolve(parseJSON(data));
      });
    }
    return defer.promise;
  })).spread(callback);
}

exports.parseRuleJson = parseRuleJson;

function _getRuleValue(rule, callback) {
  if (!rule) {
    return callback();
  }
  if (rule.value) {
    return callback(removeProtocol(rule.value, true));
  }

  var filePath = decodePath(getPath(getMatcher(rule)));
  if (rule.root) {
    filePath = join(rule.root, filePath);
  }
  protoMgr.isBinProtocol(rule.name) ? fs.readFile(filePath, function(err, data) {
    callback(err ? null : data);
    logger.error(err);
  }) : fs.readFile(filePath, UTF8_OPTIONS, function(err, data) {
    callback(err ? null : data);
    logger.error(err);
  });
}

function getRuleValue(rules, callback, noBody) {
  if (noBody || !rules) {
    return callback();
  }
  if (!Array.isArray(rules)) {
    rules = [rules];
  }

  Q.all(rules.map(function(rule) {
    var defer = Q.defer();
    _getRuleValue(rule, function(data) {
      defer.resolve(data);
    });
    return defer.promise;
  })).spread(callback);
}

exports.getRuleValue = getRuleValue;

function decodePath(path) {
  path = getPath(path, true);
  try {
    return decodeURIComponent(path);
  } catch (e) {
    logger.error(e);
  }

  try {
    return qs.unescape(path);
  } catch(e) {
    logger.error(e);
  }

  return path;
}

function getRuleFiles(rule) {
  var files = rule.files || [getPath(getUrl(rule))];
  var root = rule.root;
  return files.map(function(file) {
    var filename = '';
    file = decodePath(file);
    if (END_WIDTH_SEP_RE.test(file)) {
      filename = 'index.html';
    }
    return root ? join(root, file, filename) : join(file, filename);
  });
}

exports.getRuleFiles = getRuleFiles;

function getRuleFile(rule) {
  var filePath = getPath(getUrl(rule));
  if (!filePath) {
    return filePath;
  }

  return rule.root ? join(rule.root, decodePath(filePath)) : decodePath(filePath);
}

exports.getRuleFile = getRuleFile;

function getValue(rule) {
  return rule.value || rule.path;
}

function getMatcher(rule, raw) {
  rule = rule && (getValue(rule) || rule.matcher);
  if (rule && raw !== true) {
    rule = rule.trim();
  }
  return rule;
}

function getUrl(rule) {
  return rule && (getValue(rule) || rule.url);
}

exports.rule = {
  getMatcher: getMatcher,
  getUrl: getUrl
};

function getMatcherValue(rule, raw) {
  rule = getMatcher(rule, raw);
  return rule && removeProtocol(rule, true);
}

exports.getMatcherValue = getMatcherValue;

function _getRawType(type) {
  return typeof type === 'string' ? type.split(';')[0].toLowerCase() : '';
}

function getRawType(data) {
  return _getRawType(data.headers && data.headers['content-type']);
}

exports.getRawType = getRawType;

function getContentType(contentType) {
  if (contentType && typeof contentType != 'string') {
    contentType = contentType['content-type'] || contentType.contentType;
  }
  contentType = _getRawType(contentType);
  if (!contentType) {
    return;
  }
  if (contentType.indexOf('javascript') != -1) {
    return 'JS';
  }

  if (contentType.indexOf('css') != -1) {
    return 'CSS';
  }

  if (contentType.indexOf('html') != -1) {
    return 'HTML';
  }

  if (contentType.indexOf('json') != -1) {
    return 'JSON';
  }

  if (contentType.indexOf('xml') != -1) {
    return 'XML';
  }

  if (contentType.indexOf('text/') != -1) {
    return 'TEXT';
  }

  if (contentType.indexOf('image/') != -1) {
    return 'IMG';
  }
}

exports.getContentType = getContentType;

function supportHtmlTransform(res) {
  var headers = res.headers;
  if (getContentType(headers) != 'HTML' || !hasBody(res)) {
    return false;
  }

  var contentEncoding = getContentEncoding(headers);
//chrome新增了sdch压缩算法，对此类响应无法解码，deflate无法区分deflate还是deflateRaw
  return !contentEncoding || contentEncoding == 'gzip';
}

exports.supportHtmlTransform = supportHtmlTransform;

function removeUnsupportsHeaders(headers, supportsDeflate) {//只保留支持的zip格式：gzip、deflate
  if (!headers || !headers['accept-encoding']) {
    return;
  }
  var list = headers['accept-encoding'].split(/\s*,\s*/g);
  var acceptEncoding = [];
  for (var i = 0, len = list.length; i < len; i++) {
    var ae = list[i].toLowerCase();
    if (ae && (supportsDeflate && ae == 'deflate' || ae == 'gzip')) {
      acceptEncoding.push(ae);
    }
  }

  if (acceptEncoding = acceptEncoding.join(', ')) {
    headers['accept-encoding'] = acceptEncoding;
  } else {
    delete headers['accept-encoding'];
  }
}

exports.removeUnsupportsHeaders = removeUnsupportsHeaders;

function hasBody(res) {
  var statusCode = res.statusCode;
  return !(statusCode == 204 || (statusCode >= 300 && statusCode < 400) ||
(100 <= statusCode && statusCode <= 199));
}

exports.hasBody = hasBody;

function hasRequestBody(req) {
  req = typeof req == 'string' ? req : req.method;
  if (typeof req != 'string') {
    return false;
  }

  req = req.toUpperCase();
  return !(req === 'GET' || req === 'HEAD' ||
req === 'DELETE' || req === 'OPTIONS' ||
req === 'CONNECT');
}

exports.hasRequestBody = hasRequestBody;

function getPipeZipStream(headers) {
  var pipeStream = new PipeStream();
  switch (getContentEncoding(headers)) {
  case 'gzip':
    pipeStream.addHead(zlib.createGunzip());
    pipeStream.addTail(zlib.createGzip());
    break;
  case 'deflate':
    pipeStream.addHead(zlib.createInflate());
    pipeStream.addTail(zlib.createDeflate());
    break;
  }

  return pipeStream;
}

exports.getPipeZipStream = getPipeZipStream;

function getContentEncoding(headers) {
  var encoding = toLowerCase(headers && headers['content-encoding']);
  return encoding === 'gzip' || encoding === 'deflate' ? encoding : null;
}

exports.getContentEncoding = getContentEncoding;

function getBody(payload, headers, callback) {
  if (!payload) {
    return callback('');
  }
  var encoding = getContentEncoding(headers);
  if (!encoding) {
    return callback(decodeBuffer(payload));
  }
  var unzipStream = encoding === 'gzip' ? zlib.createGunzip() : zlib.createInflate();
  var buf;
  var callbackhandler = function(e) {
    callback(decodeBuffer(buf));
  };
  unzipStream.on('error', callbackhandler);
  unzipStream.on('end', callbackhandler);
  unzipStream.on('data', function(data) {
    buf = data;
    callbackhandler();
  });
  unzipStream.end(payload);
}

exports.getBody = getBody;

exports.isWhistleTransformData = function(obj) {
  if (!obj) {
    return false;
  }
  if (obj.speed > 0 || obj.delay > 0) {
    return true;
  }
  return !!(obj.top || obj.body || obj.bottom);
};

function getPipeIconvStream(headers) {
  var pipeStream = new PipeStream();
  var charset = getCharset(headers['content-type']);

  if (charset) {
    pipeStream.addHead(iconv.decodeStream(charset));
    pipeStream.addTail(iconv.encodeStream(charset));
  } else {
    pipeStream.addHead(function(res, next) {
      var buffer, iconvDecoder;

      res.on('data', function(chunk) {
        buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
        resolveCharset(buffer);
      });
      res.on('end', resolveCharset);

      function resolveCharset(chunk) {
        if (!charset) {
          if (chunk && buffer.length < 25600) {
            return;
          }
          charset = (!buffer || isUtf8(buffer, true)) ? 'utf8' : 'GB18030';
        }
        if (!iconvDecoder) {
          iconvDecoder = iconv.decodeStream(charset);
          next(iconvDecoder);
        }
        if (buffer) {
          iconvDecoder.write(buffer);
          buffer = null;
        }
        !chunk && iconvDecoder.end();
      }

    });

    pipeStream.addTail(function(src, next) {
      next(src.pipe(iconv.encodeStream(charset)));
    });
  }

  return pipeStream;
}

exports.getPipeIconvStream = getPipeIconvStream;

function toLowerCase(str) {
  return typeof str == 'string' ?  str.trim().toLowerCase() : str;
}

exports.toLowerCase = toLowerCase;

function toUpperCase(str) {
  return typeof str == 'string' ?  str.trim().toUpperCase() : str;
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

function getForwardedFor(headers) {
  var val = headers[config.CLIENT_IP_HEAD];
  if (!val) {
    return '';
  }
  var index = val.indexOf(',');
  if (index !== -1) {
    val = val.substring(0, index);
  }
  val = removeIPV6Prefix(val.trim());
  return net.isIP(val) ? val : '';
}
exports.getForwardedFor = getForwardedFor;

function isLocalIp(ip) {
  if (!ip || typeof ip !== 'string') {
    return true;
  }
  return ip.length < 7 || ip === LOCALHOST;
}

function getClientIp(req) {
  var ip;
  var headers = req.headers || {};
  try {
    ip = getForwardedFor(headers);
    if (!ip) {
      ip = req.connection.remoteAddress || req.socket.remoteAddress;
      ip = removeIPV6Prefix(ip);
    }
  } catch(e) {}
  return isLocalIp(ip) ? LOCALHOST : ip;
}

exports.getClientIp = getClientIp;

exports.getClientPort = function(req) {
  var headers = req.headers || {};
  var port = headers[config.CLIENT_PORT_HEAD];
  if (port > 0) {
    return port;
  }
  try {
    port = req.connection.remotePort || req.socket.remotePort;
  } catch(e) {}
  return port > 0 ? port : 0;
};

function removeIPV6Prefix(ip) {
  if (typeof ip != 'string') {
    return '';
  }

  return ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
}

exports.removeIPV6Prefix = removeIPV6Prefix;

function isUrlEncoded(req) {

  return /^post$/i.test(req.method) && /urlencoded/i.test(req.headers && req.headers['content-type']);
}

exports.isUrlEncoded = isUrlEncoded;
function isJSONContent(req) {
  if (!hasRequestBody(req)) {
    return false;
  }
  return getContentType(req.headers) === 'JSON';
}

exports.isJSONContent = isJSONContent;

function isMultipart(req) {
  return /multipart/i.test(req.headers['content-type']);
}

exports.isMultipart = isMultipart;

function getQueryString(url) {
  var index = url.indexOf('?');
  return index == -1 ? '' : url.substring(index + 1);
}

exports.getQueryString = getQueryString;

function replaceQueryString(query, replaceQuery) {
  if (replaceQuery && typeof replaceQuery != 'string') {
    replaceQuery = qs.stringify(replaceQuery);
  }
  if (!query || !replaceQuery) {
    return query || replaceQuery;
  }

  var queryList = [];
  var params = {};

  query = query.split('&').map(filterName);
  replaceQuery = replaceQuery.split('&').map(filterName);
  query.concat(replaceQuery).forEach(function(name) {
    if (name) {
      var value = params[name];
      queryList.push(name + (value == null ? '' : '=' + value));
    }
  });

  function filterName(param) {
    var index = param.indexOf('=');
    var name, value;
    if (index == -1) {
      name = param;
      value = null;
    } else {
      name = param.substring(0, index);
      value = param.substring(index + 1);
    }

    var exists = name in params;
    params[name] = value;
    return exists ? null : name;
  }

  return queryList.join('&');
}

exports.replaceQueryString = replaceQueryString;

function replaceUrlQueryString(url, queryString) {
  if (!queryString) {
    return url;
  }
  url = url || '';
  var hashIndex = url.indexOf('#');
  var hashString = '';
  if (hashIndex != -1) {
    hashString = url.substring(hashIndex);
    url = url.substring(0, hashIndex);
  }
  queryString = replaceQueryString(getQueryString(url), queryString);

  return url.replace(/\?.*$/, '') + (queryString ? '?' +  queryString : '') + hashString;
}

exports.replaceUrlQueryString = replaceUrlQueryString;

function decodeBuffer(buffer) {
  if (!buffer) {
    return '';
  }

  var text = buffer + '';
  try {
    if (text.indexOf('�') !== -1) {
      var gbkText = iconv.decode(buffer, 'GB18030');
      if (gbkText.indexOf('�') === -1) {
        return gbkText;
      }
    }
  } catch(e) {}
  return text;
}

exports.decodeBuffer = decodeBuffer;

function setHeaders(data, obj) {
  data.headers = data.headers || {};
  for (var i in obj) {
    data.headers[i] = obj[i];
  }
  return data;
}

exports.setHeaders = setHeaders;

function setHeader(data, name, value) {
  data.headers = data.headers || {};
  data.headers[name] = value;
  return data;
}

exports.setHeader = setHeader;

function getResponseBody(options, callback) {
  var done;
  var body = '';
  var response;
  var callbackHandler = function(err) {
    clearTimeout(timer);
    if (!done) {
      done = true;
      callback(err, body, response);
    }
    err && client.abort();
  };
  var timeoutHandler = function() {
    callbackHandler(new Error('Timeout'));
  };
  var isRulesText = options.isRulesText;
  var maxLength = isRulesText ? MAX_RULES_SIZE : MAX_BODY_LENGTH;
  var timer = setTimeout(timeoutHandler, REQUEST_TIMEOUT);
  options.agent = false;
  var client = (options.protocol === 'https:' ? https : http).get(options, function(res) {
    response = res;
    res.on('error', callbackHandler);
    res.setEncoding('utf8');
    res.on('data', function(data) {
      body += data;
      if (body.length > maxLength) {
        client.abort();
        callbackHandler(isRulesText ? null : new Error('The size of response body exceeds 6m'));
      } else {
        clearTimeout(timer);
        timer = setTimeout(timeoutHandler, isRulesText ? REQUEST_TIMEOUT : COMMON_TIMEOUT);
      }
    });
    res.on('end', callbackHandler);
  });
  client.on('error', callbackHandler);
  client.end();
}

exports.getResponseBody = getResponseBody;

function join(root, dir) {
  return root ? path.resolve(root, dir) : dir;
}

exports.join = join;
function mergeRuleProps(origin, add) {
  if (origin) {
    origin.list = origin.list || [extend({}, origin)];
  }
  if (add) {
    add.list = add.list || [extend({}, add)];
  }
  if (origin && add) {
    origin.list = add.list.concat(origin.list);
  }
}

function resolveProperties(rule) {
  var result = {};
  if (rule) {
    getMatcherValue(rule)
      .split('|').forEach(function(action) {
        result[action] = true;
      });
  }
  return result;
}

exports.resolveProperties = resolveProperties;

function resolveIgnore(ignore) {
  var keys = Object.keys(ignore);
  var exclude = {};
  var ignoreAll;
  ignore = {};
  keys.forEach(function(name) {
    if (name.indexOf('ignore.') === 0 || name.indexOf('ignore:') === 0) {
      exclude[name.substring(7)] = 1;
      return;
    }
    if (name.indexOf('-') === 0) {
      exclude[name.substring(1)] = 1;
      return;
    }
    name = name.replace('ignore|', '');
    if (name === 'filter' || name === 'ignore') {
      return;
    }
    if (name === 'allRules' || name === 'allProtocols'
      || name === 'All' || name === '*') {
      ignoreAll = true;
      return;
    }
    ignore[aliasProtocols[name] || name] = 1;
  });
  if (ignoreAll) {
    protocols.forEach(function(name) {
      ignore[name] = 1;
    });
    keys = protocols;
  } else {
    keys = Object.keys(ignore);
  }
  keys.forEach(function(name) {
    if (exclude[name]) {
      delete ignore[name];
    }
  });
  return {
    ignoreAll: ignoreAll,
    exclude: exclude,
    ignore: ignore
  };
}

function resolveFilter(ignore, filter) {
  filter = filter || {};
  var result = resolveIgnore(ignore);
  ignore = result.ignore;
  Object.keys(ignore).forEach(function(name) {
    if (protocols.indexOf(name) === -1) {
      filter['ignore|' + name] = true;
    } else {
      filter[name] = true;
    }
  });
  Object.keys(result.exclude).forEach(function(name) {
    filter['ignore:' + name] = 1;
  });
  if (result.ignoreAll) {
    filter.allRules = 1;
  }
  return filter;
}

exports.resolveFilter = resolveFilter;

exports.isIgnored = function(filter, name) {
  return filter[name] || filter['ignore|' + name];
};

function resolveRuleProps(rule, result) {
  result = result || {};
  if (rule) {
    rule.list.forEach(function(rule) {
      getMatcherValue(rule)
        .split('|')
          .forEach(function(action) {
            result[action] = true;
          });
    });
  }
  return result;
}

var PLUGIN_RE = /^(?:plugin|whistle)\.[a-z\d_\-]+$/;
var enableRules = ['https', 'intercept', 'capture', 'hide'];

function ignorePlugins(rules, name, exclude) {
  var isPlugin = name === 'plugin';
  if (!isPlugin && !PLUGIN_RE.test(name)) {
    return;
  }
  if (rules.plugin) {
    var list = rules.plugin.list;
    for (var i = list.length - 1; i >= 0; i--) {
      var pName = getProtocolName(list[i].matcher);
      if ((isPlugin || name === pName) && !exclude[pName]) {
        list.splice(i, 1);
      }
    }
    if (!list.length) {
      delete rules.plugin;
    }
  }
  return true;
}

function getProtocolName(url) {
  return url.substring(0, url.indexOf(':'));
}

function ignoreForwardRule(rules, name, exclude) {
  var isRule = name === 'rule';
  if (!isRule && rules[name]) {
    return;
  }
  if (rules.rule) {
    var pName = getProtocolName(rules.rule.url);
    if ((isRule || name === pName) && !exclude[pName]) {
      delete rules.rule;
    }
  }
  return true;
}

function ignoreProxy(rules, name, exclude) {
  if (!rules.proxy) {
    return;
  }
  if (name === 'proxy') {
    delete rules.proxy;
    return true;
  }
  if (!PROXY_RE.test(name)) {
    return;
  }
  var pName = getProtocolName(rules.proxy.url);
  var realName = aliasProtocols[name] || name;
  var realPName = aliasProtocols[pName] || pName;
  if (realName === realPName && !exclude[pName] && !exclude[realPName]) {
    delete rules.proxy;
  }
  return true;
}

function ignoreRules(rules, ignore, isResRules) {
  var result = resolveIgnore(ignore);
  var ignoreAll = result.ignoreAll;
  var exclude = result.exclude;
  ignore = result.ignore;
  var keys = Object.keys(ignoreAll ? rules : ignore);
  keys.forEach(function(name) {
    if (name === 'filter' || name === 'ignore' || exclude[name]) {
      return;
    }
    if (!isResRules || protoMgr.resProtocols.indexOf(name) !== -1) {
      if (ignorePlugins(rules, name, exclude)
        || ignoreProxy(rules, name, exclude)
        || ignoreForwardRule(rules, name, exclude)) {
        return;
      }
      delete rules[name];
    }
  });
}

exports.ignoreRules = ignoreRules;

function mergeRules(req, add, isResRules) {
  var origin = req.rules;
  var origAdd = add;
  add = add || {};
  mergeRuleProps(add['delete'], origin['delete']);
  mergeRuleProps(add.filter, origin.filter);
  mergeRuleProps(add.disable, origin.disable);
  mergeRuleProps(add.ignore, origin.ignore);
  mergeRuleProps(add.enable, origin.enable);
  if (isResRules && origAdd) {
    protoMgr.resProtocols.forEach(function(protocol) {
      var rule = add[protocol];
      if (rule) {
        origin[protocol] = rule;
      }
    });
  } else {
    extend(origin, origAdd);
  }

  req['delete'] = resolveRuleProps(origin['delete'], req['delete']);
  req.filter = resolveRuleProps(origin.filter, req.filter);
  req.disable = resolveRuleProps(origin.disable, req.disable);
  req.ignore = resolveRuleProps(origin.ignore, req.ignore);
  req.enable = resolveRuleProps(origin.enable, req.enable);
  enableRules.forEach(function(rule) {
    if (req.enable[rule]) {
      req.filter[rule] = true;
    }
  });
  ignoreRules(origin, extend(req.ignore, req.filter), isResRules);
  return add;
}

exports.mergeRules = mergeRules;

function transformReq(req, res, port, host) {
  var options = url.parse(getFullUrl(req));
  options.host = host || LOCALHOST;
  options.method = req.method;
  options.hostname = null;
  options.protocol = null;
  if (port > 0) {
    options.port = port;
  }
  if(req.clientIp || !req.headers[config.CLIENT_IP_HEAD]) {
    req.headers[config.CLIENT_IP_HEAD] = req.clientIp || getClientIp(req);
  }
  options.headers = req.headers;
  var client = http.request(options, function(_res) {
    if (getStatusCode(_res.statusCode)) {
      if (!host && options.pathname == '/target/target-script-min.js') {
        _res.headers['access-control-allow-origin'] = '*';
      }
      res.writeHead(_res.statusCode, _res.headers);
      _res.pipe(res);
      _res.trailers && res.addTrailers(_res.trailers);
    } else {
      sendStatusCodeError(res, _res);
    }
  });
  client.on('error', function(err) {
    res.emit('error', err);
  });
  req.pipe(client);
  return client;
}
exports.transformReq = transformReq;

function trimStr(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.trim();
}

exports.trimStr = trimStr;

function hasHeaderRules(headers) {
  return headers['x-whistle-rule-key'] ||
           headers['x-whistle-rule-value'] ||
           headers['x-whistle-rule-host'];
}

function checkIfAddInterceptPolicy(proxyHeaders, headers) {
  if (hasHeaderRules(headers)) {
    proxyHeaders['x-whistle-policy'] = 'intercept';
    return true;
  }
}

exports.checkIfAddInterceptPolicy = checkIfAddInterceptPolicy;

function toString(str) {
  if (str != null) {
    if (typeof str === 'string') {
      return str;
    }
    try {
      return JSON.stringify(str);
    } catch (e) {}
  }
  return '';
}
exports.toString = toString;

var index = 0;

exports.getReqId = function() {
  if (index > 999) {
    index = 0;
  }
  return Date.now() +'-' + (index++);
};

exports.onSocketEnd = function(socket, callback) {
  var done;
  var execCallback = function(err) {
    if (callback && !done) {
      done = true;
      callback(err);
    }
  };
  socket.on('error', execCallback);
  socket.on('close', execCallback);
};

exports.getEmptyRes = function getRes() {
  var res = new PassThrough();
  res._transform = noop;
  res.on('data', noop);
  res.destroy = noop;
  return res;
};

var REQ_HEADER_RE = /^req\.headers\.(.+)$/;
var RES_HEADER_RE = /^res\.headers\.(.+)$/;
var HEADER_RE = /^headers\.(.+)$/;

function parseDeleteProperties(req) {
  var deleteRule = req['delete'];
  var reqHeaders = {};
  var resHeaders = {};
  if (deleteRule) {
    Object.keys(deleteRule).forEach(function(prop) {
      if (REQ_HEADER_RE.test(prop)) {
        reqHeaders[RegExp.$1.toLowerCase()] = 1;
      } else if (RES_HEADER_RE.test(prop)) {
        resHeaders[RegExp.$1.toLowerCase()] = 1;
      } else if (HEADER_RE.test(prop)) {
        reqHeaders[RegExp.$1.toLowerCase()] = 1;
        resHeaders[RegExp.$1.toLowerCase()] = 1;
      }
    });
  }
  return {
    reqHeaders: reqHeaders,
    resHeaders: resHeaders
  };
}

exports.parseDeleteProperties = parseDeleteProperties;

exports.setReqCors = function(data, cors) {
  if (!cors) {
    return;
  }
  if (cors.origin !== undefined) {
    setHeader(data, 'origin', cors.origin);
  }

  if (cors.method !== undefined) {
    setHeader(data, 'access-control-request-method', cors.method);
  }

  if (cors.headers !== undefined) {
    setHeader(data, 'access-control-request-headers', cors.headers);
  }
};

exports.parseResCors = function(cors) {
  var resCors = getMatcherValue(cors);
  if (resCors == 'use-credentials' || resCors == 'credentials') {
    return 'enable';
  }
  if (resCors == '*' || resCors == 'enable') {
    return resCors;
  }
  if (cors && !resCors) {
    return '*';
  }
};

exports.setResCors = function(data, resCors, cors, origin) {
  if (resCors == '*') {
    setHeader(data, 'access-control-allow-origin', '*');
    return;
  }
  if (resCors == 'enable') {
    setHeaders(data, {
      'access-control-allow-credentials': !!origin,
      'access-control-allow-origin': origin || '*'
    });
    return;
  }
  if (cors) {
    var orig = cors.origin;
    if (orig === 'enable' || orig === 'use-credentials' || orig === 'credentials') {
      cors.origin = origin || '*';
      cors.credentials = !!origin;
    }
    origin = cors.origin;
    if (origin && typeof origin === 'string') {
      var index = origin.indexOf('//');
      if (index !== -1) {
        index = origin.indexOf('/', index + 2);
        if (index != -1) {
          origin = origin.substring(0, index);
        }
      }
      setHeader(data, 'access-control-allow-origin', origin);
    }

    if (cors.methods !== undefined) {
      setHeader(data, 'access-control-allow-methods', cors.methods);
    }

    if (cors.headers !== undefined) {
      setHeader(data, 'access-control-expose-headers', cors.headers);
    }

    if (cors.credentials !== undefined) {
      setHeader(data, 'access-control-allow-credentials', cors.credentials);
    }

    if (cors.maxAge !== undefined) {
      setHeader(data, 'access-control-max-age', cors.maxAge);
    }
  }
};

exports.disableReqProps = function(req) {
  var disable = req.disable;
  var headers = req.headers;

  if (disable.ua) {
    delete headers['user-agent'];
  }

  if (disable.cookie || disable.cookies || disable.reqCookie || disable.reqCookies) {
    delete headers.cookie;
  }

  if (disable.referer || disable.referrer) {
    delete headers.referer;
  }

  if (disable.ajax) {
    delete headers['x-requested-with'];
  }

  if (disable.cache) {
    disableReqCache(headers);
  }
};

exports.disableResProps = function(req, headers) {
  var disable = req.disable;
  if (disable.cookie || disable.cookies || disable.resCookie || disable.resCookies) {
    delete headers['set-cookie'];
  }
  if (disable.cache) {
    headers['cache-control'] = 'no-cache';
    headers.expires = new Date(Date.now() -60000000).toGMTString();
    headers.pragma = 'no-cache';
  }
  disable.csp && disableCSP(headers);
};

exports.setReqCookies = function(data, cookies, curCookies) {
  var list = cookies && Object.keys(cookies);
  if (!list || !list.length) {
    return;
  }
  var result = {};
  if (curCookies && typeof curCookies == 'string') {
    curCookies.split(/;\s*/g).forEach(function(cookie) {
      var index = cookie.indexOf('=');
      if (index == -1) {
        result[cookie] = null;
      } else {
        result[cookie.substring(0, index)] = cookie.substring(index + 1);
      }
    });
  }

  list.forEach(function(name) {
    var value = cookies[name];
    value = value && typeof value == 'object' ? value.value : value;
    result[safeEncodeURIComponent(name)] = value ? safeEncodeURIComponent(value) : value;
  });

  cookies = Object.keys(result).map(function(name) {
    var value = result[name];
    return name + (value == null ? '' : '=' + value);
  }).join('; ');
  setHeader(data, 'cookie', cookies);
};

exports.setResCookies = function(data, cookies) {
  var list = cookies && Object.keys(cookies);
  if (!list || !list.length) {
    return;
  }
  var curCookies = data.headers && data.headers['set-cookie'];
  if (!Array.isArray(curCookies)) {
    curCookies = curCookies ? [curCookies + ''] : [];
  }

  var result = {};
  curCookies.forEach(function(cookie) {
    var index = cookie.indexOf('=');
    if (index == -1) {
      result[cookie] = null;
    } else {
      result[cookie.substring(0, index)] = cookie.substring(index + 1);
    }
  });

  list.forEach(function(name) {
    var cookie = cookies[name];
    name = safeEncodeURIComponent(name);
    if (!cookie || typeof cookie != 'object') {
      result[name] = cookie ? safeEncodeURIComponent(cookie) : cookie;
    } else {
      var attrs = [];
      var value = cookie.value;
      attrs.push(value ? safeEncodeURIComponent(value) : (value == null ? '' : value));
      var maxAge = cookie.maxAge && parseInt(cookie.maxAge, 10);
      if (!Number.isNaN(maxAge)) {
        attrs.push('Expires=' + new Date(Date.now() + maxAge * 1000).toGMTString());
        attrs.push('Max-Age=' + maxAge);
      }
      cookie.secure && attrs.push('Secure');
      cookie.path && attrs.push('Path=' + cookie.path);
      cookie.domain && attrs.push('Domain=' + cookie.domain);
      cookie.httpOnly && attrs.push('HttpOnly');
      result[name] = attrs.join('; ');
    }
  });

  cookies = Object.keys(result).map(function(name) {
    var value = result[name];
    return name + (value == null ? '' : '=' + value);
  });
  setHeader(data, 'set-cookie', cookies);
};

exports.escapeRegExp = function (str) {
  if (!str) {
    return '';
  }
  return str.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
};

exports.checkTlsError = function(err) {
  if (!err) {
    return false;
  }
  if (err.code === 'EPROTO') {
    return true;
  }
  var stack = err.stack || err.message;
  if (!stack || typeof stack !== 'string') {
    return false;
  }
  if (stack.indexOf('TLSSocket.onHangUp') !== -1) {
    return true;
  }
  return stack.toLowerCase().indexOf('openssl') !== -1;
};
exports.checkAuto2Http = function(req, ip) {
  return !req.disable.auto2http && (req.enable.auto2http
    || req.rules.host || isLocalAddress(ip));
};
