var $ = require('jquery');
var toByteArray = require('base64-js').toByteArray;
var jsBase64 = require('js-base64').Base64;
var base64Decode = jsBase64.decode;
var base64Encode = jsBase64.encode;
var json2 = require('./components/json');
var evalJson = require('./components/json/eval');
var isUtf8 = require('./is-utf8');
var message = require('./message');

var BIG_NUM_RE = /[:\[][\s\n\r]*-?[\d.]{16,}[\s\n\r]*[,\}\]]/;
var dragCallbacks = {};
var dragTarget, dragOffset, dragCallback;

function noop() {}

exports.noop = noop;

exports.preventDefault = function preventDefault(e) {
  e.keyCode == 8 && e.preventDefault();
};

exports.preventBlur = function preventDefault(e) {
  e.preventDefault();
};

$(document).on('mousedown', function(e) {
  stopDrag();
  var target = $(e.target);
  Object.keys(dragCallbacks).forEach(function(selector) {
    dragTarget = target.closest(selector);
    if (dragTarget.length) {
      dragCallback = dragCallbacks[selector];
      return false;
    }
    stopDrag();
  });

  if (!dragTarget || !dragCallback) {
    return;
  }
  dragOffset = e;
  e.preventDefault();
}).on('mousemove', function(e) {
  if (!dragTarget) {
    return;
  }
  dragCallback.forEach(function(callback) {
    callback(dragTarget, e.clientX - dragOffset.clientX,
        e.clientY - dragOffset.clientY, dragOffset.clientX, dragOffset.clientY);
  });
  dragOffset = e;
}).on('mouseup', stopDrag)
.on('mouseout', function(e) {
  !e.relatedTarget && stopDrag();
});

function stopDrag() {
  dragCallback = dragTarget = dragOffset = null;
}

function addDragEvent(selector, callback) {
  if (!selector || typeof callback != 'function'
      || typeof selector != 'string'
          || !(selector = $.trim(selector))) {
    return;
  }
  var callbacks = dragCallbacks[selector] = dragCallbacks[selector] || [];
  if ($.inArray(callback, callbacks) == -1) {
    callbacks.push(callback);
  }
}

function removeDragEvent(selector, callback) {
  var callbacks = dragCallbacks[selector];
  if (!callbacks) {
    return;
  }
  if (typeof callback == 'function') {
    var index = $.inArray(callback, callbacks);
    if (index != -1) {
      callbacks.splice(index, 1);
    }
    return;
  }
  delete dragCallbacks[selector];
}

exports.addDragEvent = addDragEvent;
exports.removeDragEvent = removeDragEvent;

var keyIndex = 1;

exports.getKey = function getKey() {
  return 'w-reactkey-' + keyIndex++;
};

function getProperty(obj, name, defaultValue) {
  if (obj && (name || name !== '')) {
    if (typeof name == 'string') {
      name = name.split('.');
    }
    for (var i = 0, len = name.length - 1; i <= len; i++) {
      var prop = name[i];
      if (prop in obj) {
        obj = obj[prop];
        if (i == len) {
          return obj;
        }
        if (!obj) {
          return defaultValue;
        }
      } else {
        return defaultValue;
      }
    }
  }

  return defaultValue;
}

exports.getProperty = getProperty;

var filterEmptyStr = function(item) {
  return item.trim();
};

function getServerIp(modal) {
  var ip = modal.hostIp;
  if (!modal.serverIp && ip) {
    var realEnv = decodeURIComponentSafe(getProperty(modal, 'res.headers.x-whistle-response-for'));
    if (realEnv) {
      if (realEnv !== ip && realEnv.trim().split(/\s*,\s*/).indexOf(ip) === -1) {
        ip = realEnv + ',' + ip;
      } else {
        ip = realEnv;
      }
      modal.serverIp = ip.split(',').filter(filterEmptyStr).join(', ');
    }
  }
  return modal.serverIp || ip;
}

exports.getServerIp = getServerIp;

function getBoolean(val) {

  return !(!val || val === 'false');
}

exports.getBoolean = getBoolean;

exports.showSystemError = function(xhr) {
  xhr = xhr || {};
  var status = xhr.status;
  if (!status) {
    return alert('Please check the proxy settings or whether whistle has been started.');
  }
  if (status == 401) {
    return alert('You do not have permission to operate.');
  }
  if (status == 413) {
    return alert('The content is too large.');
  }
  alert('System error, try again later.');
};

exports.getClasses = function getClasses(obj) {
  var classes = [];
  for (var i in obj) {
    obj[i] && classes.push(i);
  }
  return classes.join(' ');
};

function getRawType(type) {
  if (type && typeof type != 'string') {
    type = type['content-type'] || type.contentType;
  }
  return typeof type === 'string' ? type.split(';')[0].toLowerCase() : '';
}

function getContentType(type) {
  type = getRawType(type);
  if (type) {
    if (type.indexOf('javascript') != -1) {
      return 'JS';
    }
    if (type.indexOf('css') != -1) {
      return 'CSS';
    }
    if (type.indexOf('html') != -1) {
      return 'HTML';
    }
    if (type.indexOf('json') != -1) {
      return 'JSON';
    }
    if (type.indexOf('xml') != -1) {
      return 'XML';
    }
    if (type.indexOf('text/') != -1) {
      return 'TEXT';
    }
    if (type.indexOf('image/') != -1) {
      return 'IMG';
    }
  }

  return null;
}

exports.getContentType = getContentType;

function isText(contentType) {
  if (!contentType) {
    return true;
  }
  contentType = getContentType(contentType);
  return contentType && contentType !== 'IMG';
}

exports.isText = isText;

function getHost(url) {
  var start = url.indexOf(':\/\/');
  start = start == -1 ? 0 : start + 3;
  var end = url.indexOf('\/', start);
  url = end == -1 ? url.substring(start) : url.substring(start, end);
  return url;
}

exports.hasBody = function hasBody(res) {
  var statusCode = res.statusCode;
  return !(statusCode == 204 || (statusCode >= 300 && statusCode < 400) ||
    (100 <= statusCode && statusCode <= 199));
};

exports.getHostname = function getHostname(url) {
  url = getHost(url);
  var end = url.lastIndexOf(':');
  return end == -1 ? url : url.substring(0, end);
};

exports.getHost = getHost;

exports.getProtocol = function getProtocol(url) {
  var index = url.indexOf(':\/\/');
  return index == -1 ? 'TUNNEL' : url.substring(0, index).toUpperCase();
};

exports.ensureVisible = function(elem, container) {
  elem = $(elem);
  container = $(container);
  var top = elem.offset().top - container.offset().top;
  if (!top) {
    return;
  }

  if (top < 0) {
    container.scrollTop(container.scrollTop() + top - 2);
    return;
  }

  top += elem[0].offsetHeight - container[0].offsetHeight;
  if (top > 0) {
    container.scrollTop(container.scrollTop() + top + 2);
  }
};

exports.parseQueryString = function(str, delimiter, seperator, decode, donotAllowRepeat) {
  var result = {};
  if (!str || !(str = (str + '').trim())) {
    return result;
  }
  delimiter = delimiter || '&';
  seperator = seperator || '=';
  str.split(delimiter).forEach(function(pair) {
    pair = pair.split(seperator);
    var key = pair[0];
    var value = pair.slice(1).join('=');
    if (key || value) {
      var val = value;
      var k = key;
      if (decode == decodeURIComponent) {
        decode = decodeURIComponentSafe;
      }
      try {
        value = decode ? decode(val) : value;
      } catch(e) {}
      try {
        key = decode ? decode(k) : key;
      } catch(e) {}
      if (!donotAllowRepeat && (key in result)) {
        var curVal = result[key];
        if (Array.isArray(curVal)) {
          curVal.push(value);
        } else {
          result[key] = [curVal, value];
        }
      } else {
        result[key] = value;
      }
    }
  });
  return result;
};

function objectToString(obj, rawNames) {
  if (!obj) {
    return '';
  }
  rawNames = rawNames || {};
  return Object.keys(obj).map(function(key) {
    var value = obj[key];
    key = rawNames[key] || key;
    if (!Array.isArray(value)) {
      return key + ': ' + value;
    }
    return value.map(function(val) {
      return key + ': ' + val;
    }).join('\r\n');
  }).join('\r\n');
}

exports.objectToString = objectToString;

exports.getOriginalReqHeaders = function(item) {
  var req = item.req;
  var headers = $.extend({}, req.headers, item.rulesHeaders);
  return objectToString(headers, req.rawHeaderNames);
};

function removeProtocol(url) {
  var index = url.indexOf('://');
  return index == -1 ? url : url.substring(index + 3);
}

exports.removeProtocol = removeProtocol;

exports.getPath = function(url) {
  url = removeProtocol(url);
  var index = url.indexOf('/');
  return index == -1 ? '/' : url.substring(index);
};

var parseJ = function (str, resolve) {
  var result;
  if (resolve && BIG_NUM_RE.test(str)) {
    window._$hasBigNumberJson = true;
    result = json2.parse(str);
  } else {
    result = JSON.parse(str);
  }
  return typeof result === 'object' ? result : null;
};

exports.evalJson = evalJson;

function parseJSON(str, resolve) {
  if (typeof str !== 'string' || !(str = str.trim())) {
    return;
  }
  if (resolve) {
    if (!/({[\w\W]*}|\[[\w\W]*\])/.test(str)) {
      return;
    }
    str = RegExp.$1;
  }
  try {
    return parseJ(str, resolve);
  } catch(e) {
    return evalJson(str);
  }
}

exports.parseJSON = parseJSON;

function resolveJSON(str, decode) {
  window._$hasBigNumberJson = false;
  var result = parseJSON(str, true);
  if (result || !str || !decode) {
    return result;
  }
  try {
    return parseJSON(decode(str), true);
  } catch(e) {}
}

exports.unique = function(arr, reverse) {
  var result = [];
  if (reverse) {
    for (var i = arr.length - 1; i >= 0; i--) {
      var item = arr[i];
      if (result.indexOf(item) == -1) {
        result.unshift(item);
      }
    }
  } else {
    arr.forEach(function(item) {
      if (result.indexOf(item) == -1) {
        result.push(item);
      }
    });
  }

  return result;
};

exports.getFilename = function(item, notEmpty) {
  var url = item.url;
  if (item.isHttps) {
    return url;
  }
  if (notEmpty && item.filename) {
    return item.filename;
  }
  if (item.simplePath) {
    return item.simplePath;
  }

  url = removeProtocol(url.replace(/[?#].*/, ''));
  var index = url.lastIndexOf('/');
  var name = index != -1 && url.substring(index + 1);
  if (!name) {
    if (notEmpty) {
      url = url.substring(0, index);
      index = url.lastIndexOf('/');
      if (index === -1) {
        name = url;
      } else {
        name = url.substring(index + 1);
      }
    } else {
      name = '/';
    }
  }
  item[notEmpty ? 'filename' : 'simplePath'] = name;
  return name;
};

var STATUS_CODES = {
  100 : 'Continue',
  101 : 'Switching Protocols',
  102 : 'Processing',                 // RFC 2518, obsoleted by RFC 4918
  200 : 'OK',
  201 : 'Created',
  202 : 'Accepted',
  203 : 'Non-Authoritative Information',
  204 : 'No Content',
  205 : 'Reset Content',
  206 : 'Partial Content',
  207 : 'Multi-Status',               // RFC 4918
  208 : 'Already Reported',
  226 : 'IM Used',
  300 : 'Multiple Choices',
  301 : 'Moved Permanently',
  302 : 'Moved Temporarily',
  303 : 'See Other',
  304 : 'Not Modified',
  305 : 'Use Proxy',
  307 : 'Temporary Redirect',
  308 : 'Permanent Redirect',         // RFC 7238
  400 : 'Bad Request',
  401 : 'Unauthorized',
  402 : 'Payment Required',
  403 : 'Forbidden',
  404 : 'Not Found',
  405 : 'Method Not Allowed',
  406 : 'Not Acceptable',
  407 : 'Proxy Authentication Required',
  408 : 'Request Time-out',
  409 : 'Conflict',
  410 : 'Gone',
  411 : 'Length Required',
  412 : 'Precondition Failed',
  413 : 'Request Entity Too Large',
  414 : 'Request-URI Too Large',
  415 : 'Unsupported Media Type',
  416 : 'Requested Range Not Satisfiable',
  417 : 'Expectation Failed',
  418 : 'I\'m a teapot',              // RFC 2324
  422 : 'Unprocessable Entity',       // RFC 4918
  423 : 'Locked',                     // RFC 4918
  424 : 'Failed Dependency',          // RFC 4918
  425 : 'Unordered Collection',       // RFC 4918
  426 : 'Upgrade Required',           // RFC 2817
  428 : 'Precondition Required',      // RFC 6585
  429 : 'Too Many Requests',          // RFC 6585
  431 : 'Request Header Fields Too Large',// RFC 6585
  500 : 'Internal Server Error',
  501 : 'Not Implemented',
  502 : 'Bad Gateway',
  503 : 'Service Unavailable',
  504 : 'Gateway Time-out',
  505 : 'HTTP Version Not Supported',
  506 : 'Variant Also Negotiates',    // RFC 2295
  507 : 'Insufficient Storage',       // RFC 4918
  509 : 'Bandwidth Limit Exceeded',
  510 : 'Not Extended',               // RFC 2774
  511 : 'Network Authentication Required' // RFC 6585
};

exports.getStatusMessage = function(res) {
  if (!res.statusCode) {
    return '';
  }
  return res.statusMessage || STATUS_CODES[res.statusCode] || 'unknown';
};

function isUrlEncoded(req) {

  return /^post$/i.test(req.method) && /urlencoded/i.test(req.headers && req.headers['content-type']);
}

exports.isUrlEncoded = isUrlEncoded;

function toString(value) {
  return value === undefined ? '' : value + '';
}

exports.toString = toString;


function openEditor(value) {
  var win = window.open('editor.html');
  win.getValue = function() {
    return value;
  };
  if (win.setValue) {
    win.setValue(value);
  }
}

exports.openEditor = openEditor;

var rentity = /['<> "&]/g;
var entities = {
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  ' ': '&nbsp;',
  '\'': '&#39;'
};
var rlf = /\r?\n/g;
var rspace = /\s/g;

function escapeFn(matched) {
  return entities[matched];
}

exports.escape = function(str) {
  if (str == null) {
    return str;
  }
  str = (str + '').replace(rentity, escapeFn);
  return str.replace(rlf, '<br />').replace(rspace, '&nbsp;');
};

function findArray(arr, cb) {
  if (typeof arr.find === 'function') {
    return arr.find(cb);
  }
  for (var i = 0, len = arr.length; i < len; i++) {
    var val = arr[i];
    if (cb(val, i, arr)) {
      return val;
    }
  }
}
exports.findArray = findArray;

exports.isFocusEditor = function() {
  var activeElement = document.activeElement;
  var nodeName = activeElement && activeElement.nodeName;
  if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA') {
    return false;
  }
  return !activeElement.readOnly && !activeElement.disabled;
};

exports.getMenuPosition = function(e, menuWidth, menuHeight) {
  var left = e.pageX;
  var top = e.pageY;
  var docElem = document.documentElement;
  if (left + menuWidth - window.scrollX >= docElem.clientWidth) {
    left = Math.max(left - menuWidth, window.scrollX + 1);
  }
  if (top + menuHeight - window.scrollY >= docElem.clientHeight) {
    top = Math.max(top - menuHeight, window.scrollY + 1);
  }
  return { top: top, left: left };
};

exports.canReplay = function(item) {
  return !item.isHttps || item.req.headers['x-whistle-policy'] === 'tunnel' || /^wss?:/.test(item.url);
};

exports.asCURL = function(item) {
  if (!item) {
    return item;
  }
  var req = item.req;
  var url = item.url.replace(/^ws/, 'http');
  var method = req.method;
  var result = ['curl', '-X', method, JSON.stringify(url)];
  var headers = req.headers;
  var rawHeaderNames = req.rawHeaderNames || {};
  Object.keys(headers).forEach(function(key) {
    if (key === 'content-length' || key === 'content-encoding' || key === 'accept-encoding') {
      return;
    }
    result.push('-H', JSON.stringify((rawHeaderNames[key] || key) + ': ' + headers[key]));
  });
  var body = (isText(req.headers) || isUrlEncoded(req)) ? getBody(req, true) : '';
  if (body) {
    result.push('-d', JSON.stringify(body));
  }
  return result.join(' ');
};

exports.parseHeadersFromHar = function(list) {
  var headers = {};
  var rawHeaderNames = {};
  if (Array.isArray(list)) {
    list.forEach(function(header) {
      var name = header.name;
      var key = name.toLowerCase();
      headers[key] = header.value;
      rawHeaderNames[key] = name;
    });
  }
  return {
    headers: headers,
    rawHeaderNames: rawHeaderNames
  };
};

exports.getTimeFromHar = function(time) {
  return time > 0 ? time : 0;
};

exports.parseKeyword = function parseKeyword(keyword) {
  keyword = keyword.trim().toLowerCase().split(/\s+/g);
  var result = {};
  var index = 0;
  for (var i = 0; i <= 3; i++) {
    var key = keyword[i];
    if (key && key.indexOf('level:') === 0) {
      result.level = key.substring(6);
    } else if (index < 3) {
      ++index;
      result['key' + index] = key;
    }
  }
  return result;
};

exports.checkLogText = function(text, keyword) {
  if (!keyword.key1) {
    return '';
  }
  text = text.toLowerCase();
  if (text.indexOf(keyword.key1) === -1) {
    return ' hide';
  }
  if (keyword.key2 && text.indexOf(keyword.key2) === -1) {
    return ' hide';
  }
  if (keyword.key3 && text.indexOf(keyword.key3) === -1) {
    return ' hide';
  }
  return '';
};

exports.scrollAtBottom = function(con, ctn) {
  return con.scrollTop + con.offsetHeight + 5 > ctn.offsetHeight;
};

exports.triggerListChange = function(name, data) {
  try {
    var onChange = window.parent[name === 'rules' ? 'onWhistleRulesChange' : 'onWhistleValuesChange'];
    if (typeof onChange === 'function') {
      onChange(data);
    }
  } catch(e) {}
};

var REG_EXP = /^\/(.+)\/(i?m?|m?i)$/;
exports.toRegExp = function(regExp) {
  if (!regExp) {
    return;
  }
  regExp = REG_EXP.test(regExp);
  try {
    regExp = regExp && new RegExp(RegExp.$1, RegExp.$2);
  } catch(e) {
    return;
  }
  return regExp;
};

function getPadding(len) {
  return len > 0 ? new Array(len + 1).join('0') : '';
}

function padLeftZero(n, len) {
  n = n.toString(16).toUpperCase();
  return getPadding(len - n.length) + n;
}

function getHexString(arr) {
  var len = arr.length;
  var offsetLen = Math.max(6, len.toString(16).length);
  var str = 'Offset';
  str = str + getPadding(offsetLen - str.length) + '  ';
  var i, ch;
  for (i = 0; i < 16; i++) {
    str += ' ' + padLeftZero(i, 2);
  }
  var result = [str];
  var rowsCount = Math.ceil(len / 16);
  for (i = 0; i < rowsCount; i++) {
    var j = i * 16;
    var rowLen = Math.min(16 + j, len);
    str = padLeftZero(Math.max(rowLen - 16, 0), offsetLen) + '  ';
    var char = '';
    for (; j < rowLen; j++) {
      ch = arr[j];
      str += ' ' + padLeftZero(ch, 2);
      char += (ch > 31 && ch < 127) || ch > 159 ? String.fromCharCode(ch) : '.';
    }
    result.push(str + new Array((17 - char.length) * 3).join(' ') + char);
  }
  return result.join('\n');
}

var COMP_RE = /%[a-f\d]{2}|./ig;
var SPACE_RE = /\+/g;
var gbkDecoder;
if (window.TextDecoder) {
  try {
    gbkDecoder = new TextDecoder('GB18030');
  } catch(e) {}
}

function decodeURIComponentSafe(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  var result = str.replace(SPACE_RE, ' ');
  try {
    return decodeURIComponent(result);
  } catch(e) {}
  if (gbkDecoder) {
    try {
      var arr = [];
      result.replace(COMP_RE, function(code) {
        if (code.length > 1) {
          arr.push(parseInt(code.substring(1), 16));
        } else {
          arr.push(String.fromCharCode(code));
        }
      });
      return gbkDecoder.decode(new window.Uint8Array(arr));
    } catch(e) {}
  }
  return str;
}

exports.decodeURIComponentSafe = decodeURIComponentSafe;

function base64toBytes(base64) {
  try {
    return toByteArray(base64);
  } catch(e) {}
  return [];
}

function decodeBase64(base64, isFrame) {
  var arr = base64toBytes(base64);
  var result = {
    hex: getHexString(arr)
  };
  if (!isUtf8(arr, isFrame)) {
    try {
      result.text = gbkDecoder.decode(arr);
    } catch(e) {}
  }
  if (!result.text) {
    try {
      result.text = base64Decode(base64);
    } catch(e) {
      result.text = base64;
    }
  }
  return result;
}

function getMediaType(res) {
  var type = getRawType(res.headers);
  if (!type || getContentType(type) !== 'IMG') {
    return '';
  }
  return type;
}

var BODY_KEY = '$body';
var HEX_KEY = '$hex';
var JSON_KEY = '$json';
if (window.Symbol) {
  BODY_KEY = window.Symbol.for(BODY_KEY);
  HEX_KEY = window.Symbol.for(HEX_KEY);
  JSON_KEY = window.Symbol.for(JSON_KEY);
}

function initData(data, isReq) {
  if ((data[BODY_KEY] && data[HEX_KEY])) {
    return;
  }
  if (!data.base64) {
    var body = data.body || data.text;
    if (data.closed || data.err) {
      body = String(data.err || 'Closed');
    }
    if (body) {
      try {
        body = String(body);
        data.base64 = base64Encode(body);
        data[BODY_KEY] = body;
        data[HEX_KEY] = getHexString(base64toBytes(data.base64));
      } catch(e) {} finally {
        delete data.body;
        delete data.bin;
        delete data.text;
      }
    }
    if (!data.base64) {
      return;
    }
  }
  var type = !isReq && getMediaType(data);
  if (type) {
    data[BODY_KEY] = 'data:' + type + ';base64,' + data.base64;
    data[HEX_KEY] = getHexString(base64toBytes(data.base64));
  } else {
    var result = decodeBase64(data.base64);
    data[BODY_KEY] = result.text;
    data[HEX_KEY] = result.hex;
  }
}

exports.getJson = function(data, isReq, decode) {
  if (data[JSON_KEY] == null) {
    var body = getBody(data, isReq);
    body = body && resolveJSON(body, decode);
    data[JSON_KEY] = body ? {
      json: body,
      str: (window._$hasBigNumberJson ? json2 : JSON).stringify(body, null, '    ')
    } : '';
  }
  return data[JSON_KEY];
};

function getBody(data, isReq) {
  initData(data, isReq);
  return data[BODY_KEY] || '';
}
exports.getBody = getBody;

exports.getHex = function(data) {
  initData(data);
  return data[HEX_KEY] || '';
};

var CHARSET_RE = /charset=([\w-]+)/i;
var META_CHARSET_RE = /<meta\s[^>]*\bcharset=(?:'|")?([\w-]+)[^>]*>/i;

function getCharset(res) {
  var type = res.headers && res.headers['content-type'];
  if (CHARSET_RE.test(type) || META_CHARSET_RE.test(getBody(res))) {
    return RegExp.$1.toUpperCase();
  }
  return 'UTF8';
}

exports.openPreview = function(data) {
  if (!data) {
    return;
  }
  var res = data.res;
  var type = getContentType(res.headers);
  var url = data.url;
  var isImg = type === 'IMG';
  if (isImg || type === 'HTML') {
    var charset = isImg ? 'UTF8' : getCharset(res);
    url += (url.indexOf('?') === -1 ? '' : '&') + '???WHISTLE_PREVIEW_CHARSET=' + charset;
    window.open(url + '???#' + (isImg ? getBody(res) : res.base64));
  }
};

exports.parseRawJson = function(str) {
  try {
    var json = JSON.parse(str);
    if (json && typeof json === 'object') {
      return json;
    }
    message.error('Error: not a json object.');
  } catch (e) {
    if (json = evalJson(str)) {
      return json;
    }
    message.error('Error: ' + e.message);
  }
};
