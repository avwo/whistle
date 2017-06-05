var http = require('http');
var url = require('url');
var path = require('path');
var os = require('os');
var fs = require('fs');
var vm = require('vm');
var fse = require('fs-extra');
var qs = require('querystring');
var extend = require('util')._extend;
var StringDecoder = require('string_decoder').StringDecoder;
var PassThrough = require('stream').PassThrough;
var iconv = require('iconv-lite');
var zlib = require('zlib');
var PipeStream = require('pipestream');
var mime = require('mime');
var Q = require('q');
var protoMgr = require('../rules/protocols');
var logger = require('./logger');
var config = require('../config');
var fileWriterCache = {};
var CRLF_RE = /\r\n|\r|\n/g;
var UTF8_OPTIONS = {encoding: 'utf8'};
var MAX_RULES_SIZE = 1024 * 1024 * 256;
var REQUEST_TIMEOUT = 5000;
var LOCALHOST = '127.0.0.1';

exports.WhistleTransform = require('./whistle-transform');
exports.ReplacePatternTransform = require('./replace-pattern-transform');
exports.ReplaceStringTransform = require('./replace-string-transform');
exports.SpeedTransform = require('./speed-transform');
exports.FileWriterTransform = require('./file-writer-transform');
exports.MultiPartParser = require('./multipart-parser');
exports.parseReq = require('./parse-req');
exports.getServer = require('./get-server');
exports.formatHeaders = exports.parseReq.formatHeaders;
exports.getRawHeaderNames = exports.parseReq.getRawHeaderNames;

function noop() {}

exports.noop = noop;

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
  timeout: 100
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
    script: new vm.Script(content)
  };
  script.time = Date.now();

  return script.script;
}

function execScriptSync(script, context) {
  try {
    if (script = getScript(script)) {
      context.console = {};
      ['fatal', 'error', 'warn', 'info', 'log', 'debug']
        .forEach(function(level) {
          context.console[level] = logger[level];
        });
      script.runInNewContext(context, VM_OPTIONS);
    }
    return true;
  } catch(e) {
    logger.error(e);
  }
}

exports.execScriptSync = execScriptSync;

function toMultipart(name, value) {
  if (value == null) {
    value = '';
  }
  if (typeof value == 'object') {
    var filename = value.filename || value.name;
    filename = filename == null ? '' : filename + '';
    value = value.content || value.value || '';
    return toBuffer('Content-Disposition: form-data; name="' + name + '"; filename="' + filename
+ '"\r\nContent-Type: ' + mime.lookup(filename) + '\r\n\r\n' + value);
  }
  return toBuffer('Content-Disposition: form-data; name="' + name + '"\r\n\r\n' + value);
}

exports.toMultipart = toMultipart;

function toMultiparts(params, boundary) {
  var content = Object.keys(params).map(function(name) {
    return boundary + '\r\n' + toMultipart(name, params[name]);
  }).join('\r\n');
  return toBuffer(content ? '\r\n' + content : '');
}

exports.toMultiparts = toMultiparts;

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

function toBuffer(buf) {
  if (buf == null || buf instanceof Buffer) {
    return buf;
  }
  buf += '';
  return new Buffer(buf);
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

  return 'Date: ' + formatDate() + '\r\nServer: ' + config.name +  '\r\n' + (stack || err.message || err);
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
  }
  if (host) {
    host = req.isHttps ? host.replace(/:443$/, '') : host.replace(/:80$/, '');
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
  return /^[a-z0-9.+-]+:\/\//i.test(url);
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

function isLocalAddress(address) {
  if (!address || typeof address != 'string') {
    return false;
  }

  if (address == LOCALHOST || address == '0:0:0:0:0:0:0:1') {
    return true;
  }

  address = address.toLowerCase();
  var interfaces = os.networkInterfaces();
  for (var i in interfaces) {
    var list = interfaces[i];
    if (Array.isArray(list)) {
      for (var j = 0, info; info = list[j]; j++) {
        if (info.address.toLowerCase() == address) {
          return true;
        }
      }
    }
  }

  return false;
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
      'content-type': 'text/plain'
    },
    body: body
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
  if (!text || typeof text != 'string' || /\s/.test(text)
|| (!isValue && (/\\|\//.test(text) && !/^&/.test(text)))) {
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
      var name, value;
      if (index != -1) {
        name = line.substring(0, index).trim();
        value = line.substring(index + 2).trim();
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
    logger.error(e);
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

function parseRuleJson(rules, callback) {
  if (!Array.isArray(rules)) {
    rules = [rules];
  }

  Q.all(rules.map(function(rule) {
    var defer = Q.defer();
    var json = _parseJSON(rule && removeProtocol(getMatcher(rule), true));
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
  if (noBody) {
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
    return root ? join(root, decodePath(file)) : decodePath(file);
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

function getMatcher(rule) {
  return rule && (getValue(rule) || rule.matcher);
}

function getUrl(rule) {
  return rule && (getValue(rule) || rule.url);
}

exports.rule = {
  getMatcher: getMatcher,
  getUrl: getUrl
};

function getMatcherValue(rule) {
  rule = getMatcher(rule);
  return rule && removeProtocol(rule, true);
}

exports.getMatcherValue = getMatcherValue;

function getContentType(contentType) {
  if (contentType && typeof contentType != 'string') {
    contentType = contentType['content-type'] || contentType.contentType;
  }

  if (typeof contentType == 'string') {
    contentType = contentType.toLowerCase();
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

    if (contentType.indexOf('image') != -1) {
      return 'IMG';
    }
  }

  return null;
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

function isEmptyObject(obj) {

  return !obj || !Object.keys(obj).length;
}

exports.isEmptyObject = isEmptyObject;

function getPipeIconvStream(headers, plainText) {
  var pipeStream = new PipeStream();
  var charset = getCharset(headers['content-type']);

  if (charset) {
    pipeStream.addHead(iconv.decodeStream(charset));
    pipeStream.addTail(iconv.encodeStream(charset));
  } else {
    pipeStream.addHead(function(res, next) {
      var buffer, iconvDecoder;
      var decoder = new StringDecoder();
      var content = '';

      res.on('data', function(chunk) {
        buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
        if (!charset) {
          try {
            content += chunk ? decoder.write(chunk) : decoder.end();
          } catch(e) {//可能抛出异常RangeError: out of range index，具体原因未知
            content = (buffer || '') + '';
            logger.error(e);
          }
          if (!plainText) {//如果没charset
            charset = getMetaCharset(content);
          }
        }
        resolveCharset(buffer);
      });
      res.on('end', resolveCharset);

      function resolveCharset(chunk) {
        if (!charset && (!chunk || content.length >= 51200)) {
          charset = content.indexOf('�') != -1 ? 'gbk' : 'utf8';
          content = null;
        }

        if (!charset) {
          return;
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
var META_CHARSET_RE = /<meta\s[^>]*\bcharset=(?:'|")?([\w-]+)[^>]*>/i;

function getCharset(str) {

  return _getCharset(str);
}

function getMetaCharset(str) {

  return _getCharset(str, true);
}

function _getCharset(str, isMeta) {
  var charset;
  if ((isMeta ? META_CHARSET_RE : CHARSET_RE).test(str)) {
    charset = RegExp.$1;
    if (!iconv.encodingExists(charset)) {
      charset = null;
    }
  }

  return charset;
}

exports.getCharset = getCharset;
exports.getMetaCharset = getMetaCharset;

function getClientIp(req, forwarded) {
  var ip;
  var headers = req.headers || {};
  try {
    ip = (forwarded && headers['x-forwarded-for'])
|| headers[config.CLIENT_IP_HEAD]
|| req.connection.remoteAddress
|| req.socket.remoteAddress;
  } catch(e) {}

  return removeIPV6Prefix(ip);
}

exports.getClientIp = getClientIp;

function removeIPV6Prefix(ip) {
  if (typeof ip != 'string') {
    return ip;
  }

  return ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
}

exports.removeIPV6Prefix = removeIPV6Prefix;

function isUrlEncoded(req) {

  return /^post$/i.test(req.method) && /urlencoded/i.test(req.headers && req.headers['content-type']);
}

exports.isUrlEncoded = isUrlEncoded;

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
  return text.indexOf('�') == -1 ? text : iconv.decode(buffer, 'GB18030');
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
  var callbackHandler = function(err) {
    clearTimeout(timer);
    if (!done) {
      done = true;
      callback(err, body);
    }
    err && client.abort();
  };
  var timeoutHandler = function() {
    callbackHandler(new Error('Timeout'));
  };
  var timer = setTimeout(timeoutHandler, REQUEST_TIMEOUT);
  var client = http.get(options, function(res) {
    res.on('error', callbackHandler);
    res.setEncoding('utf8');
    res.on('data', function(data) {
      body += data;
      if (body.length > MAX_RULES_SIZE) {
        client.abort();
        callbackHandler();
      } else {
        clearTimeout(timer);
        timer = setTimeout(timeoutHandler, REQUEST_TIMEOUT);
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
var enableRules = ['https', 'intercept', 'hide'];

function ignorePlugins(rules, name) {
  if (!rules.plugin || !PLUGIN_RE.test(name)) {
    return;
  }
  var list = rules.plugin.list;
  var protocol = name + ':';
  for (var i = list.length - 1; i >= 0; i--) {
    if (list[i].matcher.indexOf(protocol) === 0) {
      list.splice(i, 1);
    }
  }
  if (!list.length) {
    delete rules.plugin;
  }
  return true;
}

function ignoreRules(rules, ignore, isResRules) {
  enableRules.forEach(function(name) {
    delete ignore[name];
  });
  delete ignore.http;
  delete ignore.filter;
  Object.keys(ignore).forEach(function(name) {
    if (!isResRules || protoMgr.resProtocols.indexOf(name) != -1) {
      if (ignorePlugins(rules, name)) {
        return;
      }
      var rule = rules[name];
      var isProxy = name === 'socks' || name === 'proxy';
      if (!rule || isProxy) {
        rule = isProxy ? rules.proxy : rules.rule;
        if (!rule || rule.matcher.indexOf(name + ':') !== 0) {
          return;
        }
        name = isProxy ? 'proxy' : 'rule';
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

function transformReq(req, res, port, weinre) {
  var options = url.parse(getFullUrl(req));
  options.host = LOCALHOST;
  options.method = req.method;
  options.hostname = null;
  options.protocol = null;
  if (port > 0) {
    options.port = port;
  }
  req.headers['x-forwarded-for'] = req.clientIp || getClientIp(req) || LOCALHOST;
  options.headers = req.headers;
  var client = http.request(options, function(_res) {
    if (weinre && options.pathname == '/target/target-script-min.js') {
      _res.headers['access-control-allow-origin'] = '*';
    }
    if (getStatusCode(_res.statusCode)) {
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
