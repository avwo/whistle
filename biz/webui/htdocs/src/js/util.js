var $ = require('jquery');
var toByteArray = require('base64-js').toByteArray;
var fromByteArray = require('base64-js').fromByteArray;
var jsBase64 = require('js-base64').Base64;
var base64Decode = jsBase64.decode;
var base64Encode = jsBase64.encode;
var toBase64 = jsBase64.toBase64;
var json2 = require('./components/json');
var events = require('./events');
var isUtf8 = require('./is-utf8');
var message = require('./message');
var win = require('./win');

var CRLF_RE = /\r\n|\r|\n/g;
var BIG_NUM_RE = /[:\[][\s\n\r]*-?[\d.]{16,}[\s\n\r]*[,\}\]]/;
var dragCallbacks = {};
var dragTarget, dragOffset, dragCallback;
var logTempId = 0;
var RAW_CRLF_RE = /\\n|\\r/g;
var LEVELS = ['fatal', 'error', 'warn', 'info', 'debug'];
var MAX_CURL_BODY = 1024 * 72;
var search = (window.location.search || '').substring(1);
var useCustomEditor = search.indexOf('useCustomEditor') !== -1;
var JSON_RE = /^\s*(?:\{[\w\W]*\}|\[[\w\W]*\])\s*$/;
var isJSONText;
var MAX_SAFE_INTEGER = (Number.MAX_SAFE_INTEGER || '9007199254740991') + '';
var MIN_SAFE_INTEGER = Math.abs(Number.MIN_SAFE_INTEGER || '9007199254740991') + '';
var DIG_RE = /^([+-]?)([1-9]\d{0,15})$/;

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

function replaceCrLf(char) {
  return char === '\\r' ? '\r' : '\n';
}

function noop(_) {
  return _;
}

exports.noop = noop;

exports.getQuery = function() {
  if (typeof search === 'string') {
    search = parseQueryString(search);
  }
  return search;
};

function likeJson(str) {
  return str && JSON_RE.test(str);
}

exports.likeJson = likeJson;

function compare(v1, v2) {
  return v1 == v2 ? 0 : v1 > v2 ? -1 : 1;
}

function comparePlugin(p1, p2) {
  return (
    compare(p1.priority, p2.priority) ||
    compare(p2.mtime, p1.mtime) ||
    (p1._key > p2._key ? 1 : (p1._key == p2._key ? 0 : -1))
  );
}

function getPluginComparator(plugins) {
  return function (a, b) {
    var p1 = plugins[a];
    var p2 = plugins[b];
    p1._key = a;
    p2._key = b;
    return comparePlugin(p1, p2);
  };
}

exports.compare = compare;
exports.comparePlugin = comparePlugin;
exports.getPluginComparator = getPluginComparator;

function isString(str) {
  return typeof str === 'string';
}

exports.isString = isString;

function getString(str) {
  return isString(str) ? str : '';
}

exports.getString = getString;

function notEStr(str) {
  return str && typeof str === 'string';
}

exports.notEStr = notEStr;

function isBool(b) {
  return typeof b === 'boolean';
}

exports.isBool = isBool;

exports.parseLogs = function (str) {
  if (typeof str === 'string') {
    try {
      str = JSON.parse(str);
    } catch (e) {}
  }
  if (!Array.isArray(str)) {
    return;
  }
  var result;
  var count = 0;
  for (var i = 0, len = str.length; i < len; i++) {
    var item = str[i];
    if (item && item.text !== undefined) {
      result = result || [];
      item.id = ++logTempId;
      item.date = item.date > 0 ? item.date : 0;
      if (notEStr(item.level)) {
        item.level = item.level.toLowerCase();
        if (LEVELS.indexOf(item.level) === -1) {
          item.level = 'info';
        }
      } else {
        item.level = 'info';
      }
      result.push(item);
      if (++count >= 100) {
        return result;
      }
    }
  }
  return result;
};

exports.copyText = function(text, tips) {
  var btn = $('#copyTextBtn');
  btn.attr('data-clipboard-text', text);
  btn.removeClass().addClass('w-copy-text' + (tips ? '-with-tips' : ''));
  btn.trigger('click');
};

exports.preventDefault = function(e) {
  e.keyCode == 8 && e.preventDefault();
};

exports.preventBlur = function(e) {
  e.preventDefault();
};

exports.showService = function(path) {
  events.trigger('showService', path);
};

exports.hideService = function() {
  events.trigger('hideService');
};


function getSelectedText(x, y) {
  try {
    var selection = window.getSelection();
    for (var i = 0, len = selection.rangeCount; i < len; i++) {
      var range = selection.getRangeAt(i);
      var pos = range.getBoundingClientRect();
      x -= pos.x;
      y -= pos.y;
      if (x >= 0 && y >= 0 && x <= pos.width && y <= pos.height) {
        return selection.toString();
      }
    }
    selection.removeAllRanges();
  } catch (e) {}
}

exports.getSelectedText = getSelectedText;

var LOCAL_UI_HOST_LIST = [
  'local.whistlejs.com',
  'local.wproxy.org',
  'rootca.pro'
];

exports.getCAHash = function(server, urlList) {
  var ipv4 = server && server.ipv4;
  var port = (server && server.port) || 8899;
  var result = [port];
  var len = 0;

  if (Array.isArray(ipv4)) {
    ipv4.forEach(function(ip) {
      if (ip && typeof ip === 'string') {
        result.push(ip);
        urlList && urlList.push(ip);
        len += ip.length + 1;
      }
    });
  }
  if (LOCAL_UI_HOST_LIST.indexOf(location.hostname) === -1) {
    var url = location.href.replace(/[?#].*$/, '').replace();
    var index = url.lastIndexOf('/');
    if (index) {
      url = url.substring(0, index);
    }
    urlList && urlList.push(url);
    url = encodeURIComponent(url);
    len += url.length + 1;
    result.push(url);
  }
  return len && len <= 120 ? '#p=' + result.join() : '';
};

exports.download = function(data, filename) {
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  var blob = new Blob([JSON.stringify(data)], {type: 'octet/stream'});
  var url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = filename || 'data_' + formatDate() + '.txt';
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

var PROPS_MENUS = [
  {
    name: 'Copy'
  },
  {
    name: 'Copy Key'
  },
  {
    name: 'Copy Value'
  }
];

exports.handlePropsContextMenu = function(e, ctxMenu) {
  var target = $(e.target);
  var row = target.closest('tr');
  if (!row.length) {
    return;
  }
  var text = getSelectedText(e.clientX, e.clientY);
  var key = row.attr('data-name');
  var value = row.attr('data-value');
  if (!text && !key && !value) {
    return;
  }
  PROPS_MENUS[0].hide = !text;
  PROPS_MENUS[1].hide = !key;
  PROPS_MENUS[2].hide = !value;
  PROPS_MENUS[0].copyText = text;
  PROPS_MENUS[1].copyText = key;
  PROPS_MENUS[2].copyText = value;
  var height = 10 + (text ? 30 : 0) + (key ? 30 : 0) + (value ? 30 : 0);
  var data = getMenuPosition(e, 110, height);
  var list = PROPS_MENUS;
  if (!target.closest('th').length) {
    list = list.map(noop);
    list[1] = PROPS_MENUS[2];
    list[2] = PROPS_MENUS[1];
  }
  data.list = list;
  e.preventDefault();
  ctxMenu.show(data);
};

var NO_HEX_RE = /[^\da-f]+/ig;

exports.getBase64FromHexText = function (str) {
  str = str && str.trim().replace(NO_HEX_RE, '');
  if (!str) {
    return '';
  }
  var len = str.length;
  if (len % 2) {
    str += '0';
  }
  var result = [];
  for (var i = 0; i < len; i += 2) {
    result.push(parseInt(str.substring(i, i + 2), 16));
  }
  try {
    return fromByteArray(result);
  } catch (e) {}
  return '';
};

function stopDrag() {
  dragCallback = dragTarget = dragOffset = null;
}


$(document)
  .on('mousedown', function (e) {
    stopDrag();
    var target = $(e.target);
    Object.keys(dragCallbacks).some(function (selector) {
      dragTarget = target.closest(selector);
      if (dragTarget.length) {
        dragCallback = dragCallbacks[selector];
        return true;
      }
      dragTarget = null;
    });

    if (!dragTarget || !dragCallback) {
      return;
    }
    dragOffset = e;
    e.preventDefault();
  })
  .on('mousemove', function (e) {
    if (!dragTarget) {
      return;
    }
    dragCallback.forEach(function (callback) {
      callback(
        dragTarget,
        e.clientX - dragOffset.clientX,
        e.clientY - dragOffset.clientY,
        dragOffset.clientX,
        dragOffset.clientY
      );
    });
    dragOffset = e;
  })
  .on('mouseup', stopDrag)
  .on('mouseout', function (e) {
    !e.relatedTarget && stopDrag();
  });

function addDragEvent(selector, callback) {
  if (
    !selector ||
    typeof callback != 'function' ||
    typeof selector != 'string' ||
    !(selector = $.trim(selector))
  ) {
    return;
  }
  var callbacks = (dragCallbacks[selector] = dragCallbacks[selector] || []);
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

function getServerIp(modal) {
  var ip = modal.hostIp;
  if (!ip) {
    return modal.serverIp;
  }
  if (modal.realIp) {
    modal.serverIp = modal.realIp + ', ' + ip;
    delete modal.realIp;
  } else if (!modal.serverIp) {
    var res = modal.res || '';
    if (res.phost && res.phost != ip) {
      ip = res.phost + ', ' + ip;
    }
    var realEnv = decodeURIComponentSafe(
      getProperty(res, 'headers.x-whistle-response-for')
    );
    if (realEnv) {
      if (
        realEnv !== ip &&
        realEnv
          .trim()
          .split(/\s*,\s*/)
          .indexOf(ip) === -1
      ) {
        ip = realEnv + ', ' + ip;
      } else {
        ip = realEnv;
      }
      modal.serverIp = ip
        .trim()
        .split(/\s*,\s*/)
        .filter(noop)
        .join(', ');
    }
  }
  return modal.serverIp || ip;
}

function getCellValue(item, col, name) {
  name = name || col.name;
  if (name === 'hostIp') {
    return getServerIp(item);
  }
  return col.key ? getProperty(item, col.key) : item[name];
}

exports.getCellValue = getCellValue;

exports.getServerIp = getServerIp;

function getBoolean(val) {
  return !(!val || val === 'false');
}

exports.getBoolean = getBoolean;

function stopPropagation(e) {
  e.stopPropagation();
}

exports.stopPropagation = stopPropagation;

function showSystemError(xhr, useToast) {
  xhr = xhr || {};
  var status = xhr.status;
  var showTips = useToast ? message.error : win.alert;
  if (!status) {
    if (xhr.errMsg === 'timeout') {
      return showTips('Request timeout');
    }
    return showTips('Please check whether the proxy and server are available');
  }
  var msg = xhr.responseText || STATUS_CODES[status];
  if (msg) {
    return showTips('[' + status + '] ' + String(msg).substring(0, 1024));
  }
  showTips('[' + status + '] Unknown error, try again later');
}

exports.showSystemError = showSystemError;

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
  return typeof type === 'string'
    ? type.split(';')[0].trim().toLowerCase()
    : '';
}

exports.getRawType = getRawType;

exports.getExtension = function (headers) {
  var suffix = getContentType(headers);
  var type;
  if (suffix === 'XML') {
    type = getRawType(headers);
    if (type.indexOf('image/') === 0) {
      suffix = 'IMG';
    }
  }
  if (suffix !== 'IMG') {
    return suffix
      ? '.' + (suffix === 'TEXT' ? 'txt' : suffix.toLowerCase())
      : '';
  }
  type = type || getRawType(headers);
  type = type.substring(type.indexOf('/') + 1).toLowerCase();
  return /\w+/.test(type) ? '.' + RegExp['$&'] : '';
};

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
  if (!url) {
    return '';
  }
  var start = url.indexOf('://');
  start = start == -1 ? 0 : start + 3;
  var end = url.indexOf('/', start);
  url = end == -1 ? url.substring(start) : url.substring(start, end);
  if (url && (url.indexOf('?') !== -1 || url.indexOf('#') !== -1)) {
    url = url.replace(/[?#].*$/, '');
  }
  return url;
}

var HEAD_RE = /^head$/i;
exports.hasBody = function hasBody(res, req) {
  if (req && HEAD_RE.test(req.method)) {
    return false;
  }
  var statusCode = res.statusCode;
  return !(
    statusCode == 204 ||
    (statusCode >= 300 && statusCode < 400) ||
    (100 <= statusCode && statusCode <= 199)
  );
};

exports.getHostname = function getHostname(url) {
  url = getHost(url);
  var end = url.lastIndexOf(':');
  return end == -1 ? url : url.substring(0, end);
};

exports.getHost = getHost;

exports.getProtocol = function getProtocol(url) {
  var index = url.indexOf('://');
  return index == -1 ? 'TUNNEL' : url.substring(0, index).toUpperCase();
};


exports.getTransProto = function(req) {
  var headers = req.headers;
  var proto = headers && headers['x-whistle-transport-protocol'];
  if (!proto || typeof proto !== 'string' || proto.length > 33) {
    return;
  }
  try {
    return decodeURIComponent(proto).toUpperCase();
  } catch (e) {}
  return proto.toUpperCase();
};

exports.ensureVisible = function (elem, container, init) {
  elem = $(elem);
  container = $(container);
  var top = elem.offset().top - container.offset().top;
  if (!top) {
    return;
  }
  var conHeight = container[0].offsetHeight;
  var elemHeight = elem[0].offsetHeight;
  var scrollTop;
  if (top < 0) {
    if (init) {
      scrollTop = Math.ceil((conHeight - elemHeight) / 2);
      scrollTop = Math.max(0, container.scrollTop() + top - scrollTop);
      container.scrollTop(scrollTop);
    } else {
      container.scrollTop(container.scrollTop() + top - 2);
    }
    return;
  }

  top += elemHeight - conHeight;
  if (top > 0) {
    if (init) {
      scrollTop = Math.ceil(conHeight / 2);
      scrollTop = Math.max(0, container.scrollTop() + top + scrollTop);
      container.scrollTop(scrollTop);
    } else {
      container.scrollTop(container.scrollTop() + top + 2);
    }
  }
};

function parseQueryString(str, delimiter, seperator, decode, donotAllowRepeat) {
  var result = {};
  window.___hasFormData = false;
  if (!str || !(str = (str + '').trim())) {
    return result;
  }
  delimiter = delimiter || '&';
  seperator = seperator || '=';
  str.split(delimiter).forEach(function (pair) {
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
      } catch (e) {}
      try {
        key = decode ? decode(k) : key;
      } catch (e) {}
      if (!donotAllowRepeat && key in result) {
        var curVal = result[key];
        if (Array.isArray(curVal)) {
          curVal.push(value);
        } else {
          result[key] = [curVal, value];
        }
      } else {
        result[key] = value;
      }
      window.___hasFormData = true;
    }
  });
  return result;
}

exports.parseQueryString = parseQueryString;

function objectToString(obj, rawNames, noEncoding) {
  if (!obj || typeof obj === 'string') {
    return obj || '';
  }
  var keys = Object.keys(obj);
  var index = noEncoding ? keys.indexOf('content-encoding') : -1;
  index !== -1 && keys.splice(index, 1);
  return keys
    .map(function (key) {
      var value = obj[key];
      key = (rawNames && rawNames[key]) || key;
      if (!Array.isArray(value)) {
        return key + ': ' + value;
      }
      return value
        .map(function (val) {
          return key + ': ' + val;
        })
        .join('\r\n');
    })
    .join('\r\n');
}

exports.objectToString = objectToString;

function toLowerCase(str) {
  return typeof str == 'string' ? str.trim().toLowerCase() : str;
}

function getContentEncoding(headers) {
  var encoding = toLowerCase(
    (headers && headers['content-encoding']) || headers
  );
  return encoding === 'gzip' || encoding === 'br' || encoding === 'deflate' ? encoding : null;
}

exports.getOriginalReqHeaders = function (item, rulesHeaders) {
  var req = item.req;
  var headers = $.extend({}, req.headers, rulesHeaders || item.rulesHeaders, true);
  if (item.clientId && !headers['x-whistle-client-id']) {
    headers['x-whistle-client-id'] = item.clientId;
  }
  if (item.h2Id) {
    headers['x-whistle-alpn-protocol'] = item.h2Id;
  }
  if (getContentEncoding(headers)) {
    delete headers['content-encoding'];
  }
  return objectToString(headers, req.rawHeaderNames);
};

function removeProtocol(url) {
  var index = url.indexOf('://');
  return index == -1 ? url : url.substring(index + 3);
}

exports.removeProtocol = removeProtocol;

exports.getPath = function (url) {
  if (!url) {
    return '';
  }
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

function parseJSON(str, resolve) {
  isJSONText = false;
  if (typeof str !== 'string' || !(str = str.trim())) {
    return;
  }
  if (resolve) {
    if (!/({[\w\W]*}|\[[\w\W]*\])/.test(str)) {
      return;
    }
    if (str === RegExp.$1) {
      isJSONText = true;
    } else {
      str = RegExp.$1;
    }
  }
  try {
    return parseJ(str, resolve);
  } catch (e) {}
}

exports.parseJSON = parseJSON;

function isNum(n) {
  return typeof n === 'number';
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

function parseLinesJSON(text) {
  if (typeof text !== 'string' || !(text = text.trim())) {
    return null;
  }
  var result;
  text.split(/\r\n|\n|\r/).forEach(function(line) {
    if (!(line = line.trim())) {
      return;
    }
    var obj = parseLine(line);
    var name = obj.name;
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
}

exports.parseJSON2 = function (str) {
  return parseJSON(str) || parseLinesJSON(str);
};

function resolveJSON(str, decode) {
  window._$hasBigNumberJson = false;
  var result = parseJSON(str, true);
  if (result || !str || !decode) {
    return result;
  }
  try {
    return parseJSON(decode(str), true);
  } catch (e) {}
}

exports.unique = function (arr, reverse) {
  var result = [];
  if (reverse) {
    for (var i = arr.length - 1; i >= 0; i--) {
      var item = arr[i];
      if (result.indexOf(item) == -1) {
        result.unshift(item);
      }
    }
  } else {
    arr.forEach(function (item) {
      if (result.indexOf(item) == -1) {
        result.push(item);
      }
    });
  }

  return result;
};

exports.getFilename = function (item, notEmpty) {
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
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing', // RFC 2518, obsoleted by RFC 4918
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status', // RFC 4918
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Moved Temporarily',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect', // RFC 7238
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Time-out',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Large',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  418: 'I\'m a teapot', // RFC 2324
  422: 'Unprocessable Entity', // RFC 4918
  423: 'Locked', // RFC 4918
  424: 'Failed Dependency', // RFC 4918
  425: 'Unordered Collection', // RFC 4918
  426: 'Upgrade Required', // RFC 2817
  428: 'Precondition Required', // RFC 6585
  429: 'Too Many Requests', // RFC 6585
  431: 'Request Header Fields Too Large', // RFC 6585
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Time-out',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates', // RFC 2295
  507: 'Insufficient Storage', // RFC 4918
  509: 'Bandwidth Limit Exceeded',
  510: 'Not Extended', // RFC 2774
  511: 'Network Authentication Required' // RFC 6585
};

function getStatusMessage(res) {
  if (!res.statusCode) {
    return '';
  }
  if (typeof res.statusMessage == 'string') {
    return res.statusMessage;
  }
  return STATUS_CODES[res.statusCode] || 'unknown';
}

exports.getStatusMessage = getStatusMessage;

function isUrlEncoded(req) {
  return (
    /^post$/i.test(req.method) &&
    /urlencoded/i.test(req.headers && req.headers['content-type'])
  );
}

exports.isUrlEncoded = isUrlEncoded;

function toString(value) {
  return value === undefined ? '' : value + '';
}

exports.toString = toString;

exports.getValue = function(item, key) {
  key = key.split('.');
  var len = key.length;
  var value;
  if (len > 1) {
    value = item;
    for (var i = 0; i < len; i++) {
      var origVal = value;
      value = origVal[key[i]];
      if (value == null) {
        value = origVal[key[i].toLowerCase()];
        if (value == null) {
          break;
        }
      }
    }
  } else {
    value = item[key[0]];
  }
  if (value == null) {
    return '';
  }
  value = String(value);
  return value.length > 1690 ? value.substring(0, 1680) + '...' : value;
};

function openEditor(value) {
  if (
    useCustomEditor &&
    typeof window.customWhistleEditor === 'function' &&
    window.customWhistleEditor(value) !== false
  ) {
    return;
  }
  events.trigger('openEditor', value);
}

exports.openEditor = openEditor;

exports.openInNewWin = function(value) {
  var win = window.open('editor.html');
  win.getValue = function () {
    return value;
  };
  if (win.setValue) {
    win.setValue(value);
  }
};

function getMockValues(values) {
  if (!values || (!isString(values.value) && !isString(values.base64)) ||
    (!values.isFile && !notEStr(values.name))) {
    return;
  }
  return values;
}

function getMockData(data) {
  if (!Array.isArray(data) || data.length > 2 || !notEStr(data[0])) {
    return;
  }
  return {
    rules: data[0].substring(0, 16000),
    values: getMockValues(data[1])
  };
}

exports.pluginIsDisabled = function(props, name) {
  var disabledPlugins = props.disabledPlugins || {};
  return !props.ndp && (props.disabledAllPlugins || disabledPlugins[name]);
};

exports.handleImportData = function(data) {
  if (data) {
    if (data.type === 'setNetworkSettings') {
      events.trigger('setNetworkSettings', data);
      return true;
    }
    if (data.type === 'setRulesSettings') {
      events.trigger('setRulesSettings', data);
      return true;
    }
    if (data.type === 'setValuesSettings') {
      events.trigger('setValuesSettings', data);
      return true;
    }
    if (data.type === 'setComposerData') {
      events.trigger('setComposerData', data);
      return true;
    }
  }
  var mockData = getMockData(data);
  if (mockData) {
    events.trigger('showRulesDialog', mockData);
  }
  return mockData;
};

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

exports.escape = function (str) {
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

exports.isFocusEditor = function () {
  var activeElement = document.activeElement;
  var nodeName = activeElement && activeElement.nodeName;
  if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA') {
    return false;
  }
  return !activeElement.readOnly && !activeElement.disabled;
};

function getMenuPosition(e, menuWidth, menuHeight) {
  var left = e.pageX;
  var top = e.pageY;
  var docElem = document.documentElement;
  var clientWidth = docElem.clientWidth;
  if (left + menuWidth - window.scrollX >= clientWidth) {
    left = Math.max(left - menuWidth, window.scrollX + 1);
  }
  if (top + menuHeight - window.scrollY >= docElem.clientHeight - 25) {
    top = Math.max(top - menuHeight, window.scrollY + 1);
  }
  return { top: top, left: left, marginRight: clientWidth - left };
}

exports.getMenuPosition = getMenuPosition;

function socketIsClosed(reqData) {
  if (!reqData.closed && reqData.frames) {
    var lastItem = reqData.frames[reqData.frames.length - 1];
    if (lastItem && (lastItem.closed || lastItem.err)) {
      reqData.closed = true;
      reqData.lastErr = lastItem.err;
    }
  }
  return reqData.closed;
}

exports.socketIsClosed = socketIsClosed;

exports.canAbort = function (item) {
  if (!item.lost && !item.endTime) {
    return true;
  }
  if (item.reqError || item.resError) {
    return false;
  }
  return !!item.frames && !socketIsClosed(item);
};

function formatBody(body) {
  if (body.indexOf('\'') === -1) {
    return '\'' + body + '\'';
  }
  return '"' + body.replace(/"/g, '\\"') + '"';
}

exports.asCURL = function (item) {
  if (!item) {
    return item;
  }
  var req = item.req;
  var url = item.url.replace(/^ws/, 'http');
  var method = req.method;
  var result = ['curl', '-X', method, JSON.stringify(url)];
  var headers = req.headers;
  var rawHeaderNames = req.rawHeaderNames || {};
  Object.keys(headers).forEach(function (key) {
    if (
      key === 'content-length' ||
      key === 'content-encoding' ||
      key === 'accept-encoding'
    ) {
      return;
    }
    result.push(
      '-H',
      JSON.stringify((rawHeaderNames[key] || key) + ': ' + headers[key])
    );
  });
  var body = getBody(req, true);
  if (body && (body.length <= MAX_CURL_BODY || isText(req.headers) || isUrlEncoded(req))) {
    result.push('--data-raw', formatBody(body));
  }
  return result.join(' ').replace(/!/g, '\\!');
};

exports.parseHeadersFromHar = function (list) {
  var headers = {};
  var rawHeaderNames = {};
  if (Array.isArray(list)) {
    list.forEach(function (header) {
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

exports.getTimeFromHar = function (time) {
  return time > 0 ? time : 0;
};

exports.parseKeyword = function (keyword) {
  keyword = keyword.split(/\s+/);
  var result = {};
  var index = 0;
  for (var i = 0; i <= 3; i++) {
    var key = keyword[i];
    if (key && key.indexOf('level:') === 0) {
      result.level = key.substring(6).toLowerCase();
    } else if (index < 3) {
      ++index;
      result['key' + index] = key && (toRegExp(key) || key.toLowerCase());
    }
  }
  return result;
};

function checkKey(raw, text, key) {
  if (key.test) {
    return !key.test(raw);
  }
  return text.indexOf(key) === -1;
}

exports.checkKey = checkKey;

function checkLogText(text, keyword) {
  if (!keyword.key1) {
    return '';
  }
  var raw = text;
  text = text.toLowerCase();
  if (checkKey(raw, text, keyword.key1)) {
    return ' hide';
  }
  if (keyword.key2 && checkKey(raw, text, keyword.key2)) {
    return ' hide';
  }
  if (keyword.key3 && checkKey(raw, text, keyword.key3)) {
    return ' hide';
  }
  return '';
}

exports.hasVisibleLog = function (list) {
  var len = list.length;
  if (!len) {
    return false;
  }
  for (var i = 0; i < len; i++) {
    if (!list[i].hide) {
      return true;
    }
  }
};
exports.trimLogList = function (list, overflow, hasKeyword) {
  var len = list.length;
  if (hasKeyword) {
    var i = 0;
    while (overflow > 0 && i < len) {
      if (list[i].hide) {
        --len;
        --overflow;
        list.splice(i, 1);
      } else {
        ++i;
      }
    }
  }
  overflow > 0 && list.splice(0, overflow);
  return list;
};

var TIME_RE = /\b\d\d?:\d\d?:\d\d?\b/;

function toLocaleString(date) {
  var str = date.toLocaleString();
  if (!TIME_RE.test(str)) {
    return str;
  }
  var time = RegExp['$&'];
  var ms = date.getTime() % 1000;
  if (ms < 10) {
    ms = '00' + ms;
  } else if (ms < 100) {
    ms = '0' + ms;
  }
  return str.replace(time, time + '.' + ms);
}

exports.toLocaleString = toLocaleString;

exports.filterLogList = function (list, keyword, init) {
  if (!list) {
    return list;
  }
  var map;
  var result;
  var addLog;
  if (init) {
    map = {};
    result = [];
    addLog = function(log) {
      if (!map[log.id]) {
        result.push(log);
        map[log.id] = 1;
      }
    };
  }
  if (!keyword) {
    list.forEach(function(item) {
      item.hide = false;
      addLog && addLog(item);
    });
    return result || list;
  }
  list.forEach(function (log) {
    var level = keyword.level;
    if (level && log.level !== level) {
      log.hide = true;
    } else {
      var text =
        'Date: ' +
        toLocaleString(new Date(log.date)) +
        log.logId +
        '\r\n' +
        log.text;
      log.hide = checkLogText(text, keyword);
    }
    addLog && addLog(log);
  });
  return result || list;
};

exports.checkLogText = checkLogText;

exports.scrollAtBottom = function (con, ctn) {
  return con.scrollTop + con.offsetHeight + 5 > ctn.offsetHeight;
};

exports.triggerListChange = function (name, data) {
  try {
    var onChange =
      window.parent[
        name === 'rules' ? 'onWhistleRulesChange' : 'onWhistleValuesChange'
      ];
    if (typeof onChange === 'function') {
      onChange(data);
    }
  } catch (e) {}
};

var REG_EXP = /^\/(.+)\/([miu]{0,3})$/;
function toRegExp(regExp) {
  if (regExp && REG_EXP.test(regExp)) {
    try {
      return new RegExp(RegExp.$1, RegExp.$2);
    } catch (e) {}
  }
}
exports.toRegExp = toRegExp;

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
  var str, ch;
  var result = [];
  var rowsCount = Math.ceil(len / 16);
  for (var i = 0; i < rowsCount; i++) {
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

var COMP_RE = /%[a-f\d]{2}|./gi;
var CHECK_COMP_RE = /%[a-f\d]{2}/i;
var SPACE_RE = /\+/g;
var gbkDecoder;
if (window.TextDecoder) {
  try {
    gbkDecoder = new TextDecoder('GB18030');
  } catch (e) {}
}

function decodeURIComponentSafe(str, isUtf8) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  var result = str.replace(SPACE_RE, ' ');
  try {
    return decodeURIComponent(result);
  } catch (e) {}
  if (!isUtf8 && gbkDecoder && CHECK_COMP_RE.test(result)) {
    try {
      var arr = [];
      result.replace(COMP_RE, function (code) {
        if (code.length > 1) {
          arr.push(parseInt(code.substring(1), 16));
        } else {
          arr.push(String.fromCharCode(code));
        }
      });
      if (!isUtf8(arr)) {
        return gbkDecoder.decode(new window.Uint8Array(arr));
      }
    } catch (e) {}
  }
  return str;
}

exports.decodeURIComponentSafe = decodeURIComponentSafe;

function safeEncodeURIComponent(str) {
  try {
    return encodeURIComponent(str);
  } catch (e) {}
  return str;
}
exports.encodeURIComponent = safeEncodeURIComponent;

function base64toBytes(base64) {
  try {
    return toByteArray(base64);
  } catch (e) {}
  return [];
}

exports.base64Decode = base64Decode;

function decodeBase64(base64) {
  var arr = base64toBytes(base64);
  var result = {
    hex: getHexString(arr)
  };
  if (!isUtf8(arr)) {
    try {
      result.text = gbkDecoder.decode(arr);
    } catch (e) {}
  }
  if (!result.text) {
    try {
      result.text = base64Decode(base64);
    } catch (e) {
      result.text = base64;
    }
  }
  return result;
}

exports.decodeBase64 = decodeBase64;

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

exports.BODY_KEY = BODY_KEY;
exports.HEX_KEY = HEX_KEY;
exports.JSON_KEY = JSON_KEY;

function getHexFromBase64(base64) {
  if (base64) {
    try {
      return getHexString(base64toBytes(base64));
    } catch (e) {}
  }
  return base64;
}

exports.getHexFromBase64 = getHexFromBase64;

function getClosedMsg(data) {
  return 'Closed' + (data.code ? ' (' + data.code + ')' : '');
}

function initData(data, isReq) {
  if (data[BODY_KEY] && data[HEX_KEY]) {
    return;
  }
  if (!data.base64) {
    var body = data.body || data.text;
    if (data.closed || data.err) {
      body = String(data.err || getClosedMsg(data));
    }
    if (body) {
      try {
        body = String(body);
        data.base64 = base64Encode(body);
        data[BODY_KEY] = body;
        data[HEX_KEY] = getHexFromBase64(data.base64);
      } catch (e) {
      } finally {
        delete data.body;
        delete data.bin;
        delete data.text;
      }
    }
    if (!data.base64 || data._hasError) {
      return;
    }
  }
  var type = !isReq && getMediaType(data);
  if (type) {
    data[BODY_KEY] = 'data:' + type + ';base64,' + data.base64;
    data[HEX_KEY] = getHexFromBase64(data.base64);
  } else {
    var result = decodeBase64(data.base64);
    data[BODY_KEY] = result.text;
    data[HEX_KEY] = result.hex;
  }
}

function getJson(data, isReq, decode) {
  if (data[JSON_KEY] == null) {
    var body = getBody(data, isReq);
    body = body && resolveJSON(body, decode);
    data[JSON_KEY] = body
      ? {
        json: body,
        isJSONText: isJSONText,
        str: (window._$hasBigNumberJson ? json2 : JSON).stringify(
            body,
            null,
            '    '
          )
      }
      : '';
  }
  return data[JSON_KEY];
}

exports.getJson = getJson;

exports.getJsonStr = function(data, isReq, decode) {
  var json = getJson(data, isReq, decode);
  return json && json.str;
};

function getBody(data, isReq) {
  initData(data, isReq);
  return data[BODY_KEY] || '';
}
exports.getBody = getBody;

exports.getHex = function (data) {
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

function getPreviewUrl(data) {
  if (!data) {
    return;
  }
  var res = data.res;
  var type = getContentType(res.headers);
  var isImg = type === 'IMG';
  if (isImg || type === 'HTML') {
    var url = data.url;
    if (/^((?:http|ws)s?:)?\/\//i.test(url)) {
      if (RegExp.$1) {
        url = url.replace(/^ws/, 'http');
      } else {
        url = 'http:' + url;
      }
    } else {
      url = 'http://' + url;
    }
    var charset = isImg ? 'UTF8' : getCharset(res);
    url +=
      (url.indexOf('?') === -1 ? '' : '&') +
      '???WHISTLE_PREVIEW_CHARSET=' +
      charset;
    return url + '???#' + (isImg ? getBody(res) : res.base64);
  }
}

exports.getPreviewUrl = getPreviewUrl;

exports.openPreview = function (data) {
  var url = getPreviewUrl(data);
  url && window.open(url);
};

function parseRawJson(str, quite) {
  try {
    var json = JSON.parse(str);
    if (json && typeof json === 'object') {
      return json;
    }
    !quite && message.error('Error: invalid JSON format');
  } catch (e) {
    !quite && message.error('Error: ' + e.message);
  }
}

exports.parseRawJson = parseRawJson;

function parseHeaders(str) {
  var headers = {};
  str = str.split(CRLF_RE);
  str.forEach(function (line) {
    var index = line.indexOf(':');
    var value = '';
    if (index != -1) {
      value = line.substring(index + 1).trim();
      var name = line.substring(0, index).trim();
      var list = headers[name];
      if (list) {
        if (!Array.isArray(list)) {
          headers[name] = list = [list];
        }
        list.push(value);
      } else {
        headers[name] = value;
      }
    }
  });
  return headers;
}

exports.parseHeaders = function (str) {
  str = typeof str === 'string' ? str.trim() : null;
  if (!str) {
    return {};
  }
  return parseRawJson(str, true) || parseHeaders(str);
};

function hasRequestBody(method) {
  if (typeof method != 'string') {
    return false;
  }
  method = method.toUpperCase();
  return !(
    method === 'GET' ||
    method === 'HEAD' ||
    method === 'OPTIONS' ||
    method === 'CONNECT'
  );
}

exports.hasRequestBody = hasRequestBody;

var NON_LATIN1_RE = /([^\x00-\xFF]|[\r\n%])/g;
exports.encodeNonLatin1Char = function (str) {
  /*eslint no-control-regex: "off"*/
  return str && typeof str === 'string'
    ? str.replace(NON_LATIN1_RE, safeEncodeURIComponent)
    : '';
};

function formatSemer(ver) {
  return ver
    ? ver
        .split('.')
        .map(function (v) {
          v = parseInt(v, 10) || 0;
          return v > 9 ? v : '0' + v;
        })
        .join('.')
    : '';
}

function compareVersion(v1, v2) {
  var test1 = '';
  var test2 = '';
  var index = v1 && v1.indexOf('-');
  if (index > -1) {
    test1 = v1.slice(index + 1);
    v1 = v1.slice(0, index);
  }
  index = v2 && v2.indexOf('-');
  if (index > -1) {
    test2 = v2.slice(index + 1);
    v2 = v2.slice(0, index);
  }
  v1 = formatSemer(v1);
  v2 = formatSemer(v2);
  if (v1 > v2) {
    return true;
  }
  if (v2 > v1) {
    return false;
  }

  return test1 < test2;
}
exports.compareVersion = compareVersion;

function getHexLine(line) {
  var index = line.indexOf('  ') + 2;
  return line.substring(index, line.indexOf('  ', index)).trim();
}

exports.getHexText = function (text) {
  if (!text) {
    return '';
  }
  return text.split('\n').map(getHexLine).join('\n');
};

var curPageName;
function triggerPageChange(name) {
  try {
    var onPageChange = window.parent.onWhistlePageChange;
    if (typeof onPageChange === 'function' && curPageName !== name) {
      curPageName = name;
      onPageChange(name, location.href);
    }
  } catch (e) {}
}

exports.triggerPageChange = triggerPageChange;

var curActiveRules;
exports.triggerRulesActiveChange = function (name) {
  if (curActiveRules === name) {
    return;
  }
  curActiveRules = name;
  try {
    var onChange = window.parent.onWhistleRulesActiveChange;
    if (typeof onChange === 'function') {
      onChange(name, location.href);
    }
  } catch (e) {}
};
var curActiveValues;
exports.triggerValuesActiveChange = function (name) {
  if (curActiveValues === name) {
    return;
  }
  curActiveValues = name;
  try {
    var onChange = window.parent.onWhistleValuesActiveChange;
    if (typeof onChange === 'function') {
      onChange(name, location.href);
    }
  } catch (e) {}
};

function changePageName(name) {
  var hash = location.hash.substring(1);
  var index = hash.indexOf('?');
  hash = index === -1 ? '' : hash.substring(index);
  location.hash = name + hash;
  triggerPageChange(name);
}

exports.changePageName = changePageName;

exports.getTempName = function () {
  return Date.now() + '' + Math.floor(Math.random() * 10000);
};

function readFile(file, callback, type) {
  var reader = new FileReader();
  var done;
  var execCallback = function (err, result) {
    if (done) {
      return;
    }
    done = true;
    if (err) {
      reader.abort();
      return win.alert(err.message);
    }
    callback(result);
  };
  var isText = type === 'text';
  reader[isText ? 'readAsText' : 'readAsArrayBuffer'](file);
  reader.onerror = execCallback;
  reader.onabort = function () {
    execCallback(new Error('Aborted'));
  };
  reader.onload = function () {
    var result = reader.result;
    try {
      if (!isText) {
        result = new window.Uint8Array(result);
        result = type === 'base64' ? fromByteArray(result) : result;
      }
      execCallback(null, result);
    } catch (e) {
      execCallback(e);
    }
  };
  return reader;
}

exports.readFile = readFile;

exports.readFileAsBase64 = function (file, callback) {
  return readFile(file, callback, 'base64');
};

exports.readFileAsText = function (file, callback) {
  return readFile(file, callback, 'text');
};

exports.addPluginMenus = function (item, list, maxTop, disabled, treeId, url) {
  var pluginsList = (item.list = list);
  var count = pluginsList.length;
  if (count) {
    item.hide = false;
    var disabledOthers = disabled;
    var curUrl = treeId || url;
    for (var j = 0; j < count; j++) {
      var plugin = pluginsList[j];
      var pattern = plugin._urlPattern;
      if (plugin.required || plugin.requiredTreeNode) {
        var disd = disabled && (!plugin.requiredTreeNode || !treeId);
        if (!disd && (pattern && (!curUrl || !pattern.test(curUrl)))) {
          disd = true;
        }
        plugin.disabled = disd;
        if (!disd) {
          disabledOthers = false;
        }
      } else if (pattern && (!curUrl || !pattern.test(curUrl))) {
        plugin.disabled = true;
      } else {
        disabledOthers = plugin.disabled = false;
      }
    }
    var top = count - 2;
    item.top = top > 0 ? Math.min(maxTop, top) : undefined;
    item.disabled = disabledOthers;
  } else {
    item.hide = true;
  }
};

exports.getText = function(text) {
  if (text && typeof text === 'object') {
    try {
      return JSON.stringify(text, null, '  ');
    } catch (e) {}
  }
  return text == null ? '' : String(text);
};

exports.parseImportData = function (data, modal, isValues) {
  var list = [];
  var hasConflict;
  var handleItem = function(name, value) {
    if (value == null) {
      return;
    }
    if (isValues) {
      if (typeof value === 'object') {
        try {
          value = JSON.stringify(value, null, '  ');
        } catch (e) {
          return;
        }
      } else {
        value = value + '';
      }
    }
    if (typeof value !== 'string') {
      return;
    }
    var isConflict;
    var item = modal && modal.get(name);
    if (item) {
      isConflict = item.value && item.value != value;
      hasConflict = hasConflict || isConflict;
    }
    list.push({
      name: name,
      value: value,
      isConflict: isConflict
    });
  };
  if (Array.isArray(data)) {
    var map = {};
    data.forEach(function (item) {
      var name = item && item.name;
      if (name && typeof name === 'string' && !map[name]) {
        var value = isGroup(name) ? '' : (item.value == null ? item.content : item.value);
        map[name] = 1;
        handleItem(name, value);
      }
    });
  } else {
    Object.keys(data).forEach(function (name) {
      name && handleItem(name, data[name]);
    });
  }
  list.hasConflict = hasConflict;
  return list;
};

function getSize(size) {
  if (!(size >= 1024)) {
    return size;
  }
  size = (size / 1024).toFixed(2);
  if (size < 1024) {
    return size + 'k';
  }
  size = (size / 1024).toFixed(2);
  if (size < 1024) {
    return size + 'm';
  }
  return (size / 1024).toFixed(2) + 'G';
}

exports.getSize = getSize;

function getQps(num) {
  if (!num) {
    return '0';
  }
  return (num / 100).toFixed(2);
}

exports.getQps = getQps;

function indexOfList(list, subList, start) {
  var len = list.length;
  var subLen = subList && subList.length;
  if (!len || !subLen) {
    return -1;
  }
  var first = subList[0];
  var index = list.indexOf(first, start || 0);
  if (subLen === 1) {
    return index;
  }
  var result = -1;
  while (index !== -1) {
    result = index;
    for (var i = 0; i < subLen; i++) {
      if (subList[i] !== list[i + index]) {
        result = -1;
        index = list.indexOf(first, index + 1);
        break;
      }
    }
    if (result !== -1) {
      return result;
    }
  }
  return result;
}

function concatByteArray(list1, list2, list3) {
  var len = list1.length;
  var len2 = list2.length;
  var result = new window.Uint8Array(len + len2 + (list3 ? list3.length : 0));
  result.set(list1);
  result.set(list2, len);
  list3 && result.set(list3, len + len2);
  return result;
}

exports.toBase64 = toBase64;

function strToByteArray(str) {
  try {
    str = toBase64(str);
    return toByteArray(str);
  } catch (e) {}
  return null;
}

function base64ToByteArray(str) {
  try {
    return toByteArray(str);
  } catch (e) {}
  return null;
}

exports.base64ToByteArray = base64ToByteArray;

var UPLOAD_TYPE_RE = /^\s*multipart\//i;
var BOUNDARY_RE = /boundary=(?:"([^"]+)"|([^;]+))/i;
var BODY_SEP = strToByteArray('\r\n\r\n');
var NAME_RE = /name=(?:"([^"]+)"|([^;]+))/i;
var FILENAME_RE = /filename=(?:"([^"]+)"|([^;]+))/i;
var TYPE_RE = /^\s*content-type:\s*([^\s]+)/i;
var CRLF_BUF = strToByteArray('\r\n');
var EMPTY_BUF = strToByteArray('');

exports.EMPTY_BUF = EMPTY_BUF;

function parseMultiHeader(header) {
  try {
    header = base64Decode(fromByteArray(header)).split('\r\n');
  } catch (e) {
    return;
  }
  if (!NAME_RE.test(header[0])) {
    return;
  }
  var result = {
    name: RegExp.$1 || RegExp.$2,
    value: ''
  };
  if (FILENAME_RE.test(header[0].replace(RegExp['$&'], '\n'))) {
    result.value = RegExp.$1 || RegExp.$2;
  }
  if (TYPE_RE.test(header[1])) {
    result.type = RegExp.$1;
  }
  return result;
}

exports.isUploadForm = function (req) {
  var type = req.headers && req.headers['content-type'];
  return UPLOAD_TYPE_RE.test(type);
};

function getUploadName(header) {
  var result = [];
  if (header.value) {
    result.push(header.value);
  }
  if (header.type) {
    result.push(header.type);
  }
  result = result.join('; ');
  return header.name + (result ? '\r\u0000(' + result + ')' : '');
}

function parseUploadBody(body, boundary, needObj) {
  var sep = '--' + boundary;
  var start = strToByteArray(sep + '\r\n');
  var end = strToByteArray('\r\n' + sep);
  var len = start.length;
  var index = indexOfList(body, start);
  var result = needObj ? {} : [];
  while (index >= 0) {
    index += len;
    var hIndex = indexOfList(body, BODY_SEP, index - 2);
    if (hIndex === -1) {
      return result;
    }
    var endIndex = indexOfList(body, end, hIndex + 2);
    if (endIndex === -1) {
      return result;
    }
    var header = body.slice(index, hIndex);
    hIndex += 4;
    var data = hIndex >= endIndex ? '' : body.slice(hIndex, endIndex);
    header = header && parseMultiHeader(header);
    if (header) {
      if (needObj) {
        var name = getUploadName(header);
        var curVal = header.value;
        if (data) {
          try {
            curVal = base64Decode(fromByteArray(data)) || '';
          } catch (e) {
            curVal = '[Binary data]';
          }
        }
        var value = result[name];
        if (value != null) {
          if (!Array.isArray(value)) {
            value = result[name] = [ value ];
          }
          value.push(curVal);
        } else {
          result[name] = curVal;
        }
      } else {
        if (header.type) {
          header.data = data || EMPTY_BUF;
        } else {
          try {
            header.value = data && base64Decode(fromByteArray(data));
          } catch (e) {}
        }
        result.push(header);
      }
    }
    index = indexOfList(body, start, endIndex + 2);
  }

  return result;
}

exports.parseUploadBody = function (req, needObj) {
  if (!req.base64) {
    return;
  }
  var type = req.headers && req.headers['content-type'];
  if (!BOUNDARY_RE.test(type)) {
    return;
  }
  var boundary = RegExp.$1 || RegExp.$2;
  var body = base64ToByteArray(req.base64);
  return body && parseUploadBody(body, boundary, needObj);
};

function getMultiPart(part) {
  var header = 'Content-Disposition: form-data; name="' + part.name + '"';
  var data = part.data;
  if (data) {
    header += '; filename="' + part.value + '"';
    if (part.type) {
      header += '\r\nContent-Type: ' + part.type;
    }
  } else {
    data = part.value && strToByteArray(part.value);
  }
  if (!header) {
    return;
  }
  header = strToByteArray(header + '\r\n\r\n');
  return data ? concatByteArray(header, data, CRLF_BUF) : header;
}

function getBoundary() {
  return (
    '----WhistleUploadForm' +
    Date.now().toString(16) +
    Math.floor(Math.random() * 100000000000).toString(16)
  );
}

var base64abc = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '+',
  '/'
];

function bytesToBase64(bytes) {
  var result = '';
  var i;
  var l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
    result += base64abc[bytes[i] & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 0x03) << 4];
    result += '==';
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[(bytes[i - 1] & 0x0f) << 2];
    result += '=';
  }
  return result;
}

exports.bytesToBase64 = bytesToBase64;

exports.getMultiBody = function (fields) {
  var result;
  var boundary = getBoundary();
  var boundBuf = strToByteArray('--' + boundary + '\r\n');
  fields.forEach(function (field) {
    field = getMultiPart(field);
    if (field) {
      field = concatByteArray(boundBuf, field);
      result = result ? concatByteArray(result, field) : field;
    }
  });
  result =
    result && concatByteArray(result, strToByteArray('--' + boundary + '--'));
  return {
    boundary: boundary,
    length: result ? result.length : 0,
    base64: result && bytesToBase64(result)
  };
};

function padding(num) {
  return num < 10 ? '0' + num : num;
}

exports.padding = padding;

function paddingMS(ms) {
  if (ms > 99) {
    return ms;
  }
  if (ms > 9) {
    return '0' + ms;
  }
  return '00' + ms;
}

function formatDate(date) {
  date = date || new Date();
  var result = [];
  result.push(date.getFullYear());
  result.push(padding(date.getMonth() + 1));
  result.push(padding(date.getDate()));
  result.push(padding(date.getHours()));
  result.push(padding(date.getMinutes()));
  result.push(padding(date.getSeconds()));
  result.push(paddingMS(date.getMilliseconds()));
  return result.join('');
}

exports.formatDate = formatDate;

exports.formatTime = function (time) {
  time = Math.floor(time / 1000);
  var sec = padding(time % 60);
  time = Math.floor(time / 60);
  var min = padding(time % 60);
  time = Math.floor(time / 60);
  var hour = padding(time % 24);
  var day = Math.floor(time / 24);
  return (day ? padding(day) + ' ' : '') + hour + ':' + min + ':' + sec;
};

var EMPTY_OBJ = {};

function parseResCookie(cookie) {
  cookie = parseQueryString(cookie, /;\s*/, null, null, true);
  var result = {
    httpOnly: false,
    secure: false
  };
  for (var i in cookie) {
    switch (i.toLowerCase()) {
    case 'domain':
      result.domain = cookie[i];
      break;
    case 'path':
      result.path = cookie[i];
      break;
    case 'expires':
      result.expires = cookie[i];
      break;
    case 'max-age':
      result['max-age'] = cookie[i];
      result.maxAge = cookie[i];
      result.maxage = cookie[i];
      break;
    case 'httponly':
      result.httpOnly = true;
      result.httponly = true;
      break;
    case 'secure':
      result.secure = true;
      break;
    case 'partitioned':
      result.partitioned = true;
      break;
    case 'samesite':
      result.sameSite = cookie[i];
      result.samesite = cookie[i];
      break;
    default:
      if (!result[0]) {
        result.name = i;
        result.value = cookie[i];
      }
    }
  }

  return result;
}

function objectToArray(obj, rawNames) {
  var result = [];
  if (obj) {
    rawNames = rawNames || EMPTY_OBJ;
    Object.keys(obj).forEach(function (name) {
      var value = obj[name];
      name = rawNames[name] || name;
      if (Array.isArray(value)) {
        value.forEach(function (val) {
          result.push({
            name: name,
            value: val + ''
          });
        });
      } else {
        result.push({
          name: name,
          value: value + ''
        });
      }
    });
  }
  return result;
}

function stringToArray(str, delimiter) {
  str = parseQueryString(str, delimiter);
  return objectToArray(str);
}

function getPostData(req) {
  var headers = req.headers || '';
  return {
    size: req.unzipSize || req.size || -1,
    mimeType: headers['content-type'] || 'none',
    params: [],
    text: ''
  };
}

function toHarReq(item) {
  var req = item.req;
  var url = item.url;
  var headers = req.headers || '';
  var cookies = stringToArray(headers.cookie, /;\s*/);
  var index = url.indexOf('?');
  var queryString = index === -1 ? [] : stringToArray(url.substring(index + 1));
  var isForm = isUrlEncoded(req);
  var postData;
  if (isForm) {
    var body = getBody(req, true);
    postData = postData || getPostData(req);
    postData.text = body;
    postData.base64 = req.base64;
    postData.params = stringToArray(body);
  } else if (req.base64) {
    postData = postData || getPostData(req);
    postData.base64 = req.base64;
    postData.text = getBody(req, true);
  } else if (req.body) {
    postData = postData || getPostData(req);
    postData.text = req.body;
  }
  return {
    method: item.method,
    url: url,
    ip: req.ip,
    port: req.port,
    httpVersion: item.useH2 ? 'HTTP/2.0' : 'HTTP/1.1',
    cookies: cookies,
    headers: objectToArray(headers, req.rawHeaderNames),
    queryString: queryString,
    postData: postData,
    headersSize: -1,
    bodySize: req.size || -1,
    comment: ''
  };
}

function toHarRes(item) {
  var res = item.res;
  var headers = res.headers || '';
  var cookies = headers['set-cookie'];
  if (cookies) {
    if (Array.isArray(cookies)) {
      cookies = cookies.map(parseResCookie);
    } else {
      cookies = [parseResCookie(cookies)];
    }
  } else {
    cookies = [];
  }
  return {
    statusCode: res.statusCode,
    status: parseInt(res.statusCode, 10) || 0,
    ip: res.ip,
    port: res.port,
    statusText: getStatusMessage(res),
    httpVersion: item.useH2 ? 'HTTP/2.0' : 'HTTP/1.1',
    cookies: cookies,
    headers: objectToArray(headers, res.rawHeaderNames),
    content: {
      size: res.unzipSize || res.size || -1,
      mimeType: headers['content-type'] || '',
      base64: res.base64,
      text: getBody(res)
    },
    redirectURL: headers.location || '',
    headersSize: -1,
    bodySize: res.size || -1,
    comment: ''
  };
}

exports.toHar = function (item) {
  var time = -1;
  var dns = -1;
  var send = -1;
  var receive = -1;
  if (item.dnsTime >= item.startTime) {
    dns = item.dnsTime - item.startTime;
    time = dns;
    if (item.requestTime >= item.dnsTime) {
      send = item.requestTime - item.dnsTime;
      if (item.responseTime >= item.requestTime) {
        receive = item.responseTime - item.requestTime;
        if (item.endTime >= item.responseTime) {
          time = item.endTime - item.startTime;
        } else {
          time = item.responseTime - item.startTime;
        }
      } else {
        time = item.requestTime - item.startTime;
      }
    }
  }
  return {
    startedDateTime: new Date(item.startTime).toISOString(),
    ttfb: item.ttfb,
    time: time,
    whistleCustomData: item.customData,
    whistleRules: item.rules,
    whistleFwdHost: item.fwdHost,
    whistleSniPlugin: item.sniPlugin,
    whistleVersion: item.version,
    whistleNodeVersion: item.nodeVersion,
    whistleRealUrl: item.realUrl,
    whistleCaptureError: item.captureError,
    whistleReqError: item.reqError,
    whistleIsHttps: item.isHttps,
    whistleResError: item.resError,
    whistleTimes: {
      startTime: item.startTime,
      dnsTime: item.dnsTime,
      requestTime: item.requestTime,
      responseTime: item.responseTime,
      endTime: item.endTime
    },
    request: toHarReq(item),
    response: toHarRes(item),
    frames: item.frames,
    cache: {},
    timings: {
      blocked: 0,
      dns: dns,
      connect: -1,
      send: send,
      wait: -1,
      receive: receive,
      ssl: -1,
      comment: ''
    },
    clientIPAddress: item.clientIp,
    serverIPAddress: item.hostIp
  };
};

exports.getUrl = function (url) {
  return url && url.indexOf('/') === -1 ? 'tunnel://' + url : url;
};

function expandAll(node) {
  if (node.children) {
    node.expand = true;
    node.pExpand = true;
    node.children.forEach(expandAll);
  }
}

exports.expandAll = expandAll;

function collapseAll(node) {
  if (node.children) {
    node.expand = false;
    node.pExpand = false;
    node.children.forEach(collapseAll);
  }
}

exports.collapseAll = collapseAll;

function setPExpand(node, pExpand) {
  if (node.children) {
    node.pExpand = pExpand;
    pExpand = node.expand && pExpand;
    node.children.forEach(function (child) {
      setPExpand(child, pExpand);
    });
  }
}

function expand(node) {
  node.expand = true;
  setPExpand(node, true);
}

function collapse(node) {
  node.expand = false;
  setPExpand(node, false);
}

exports.expand = expand;
exports.collapse = collapse;

var PROTO_RE = /^((?:http|ws)s?:\/\/)[^/?]*/;
exports.getRawUrl = function (item) {
  return item.fwdHost && item.url.replace(PROTO_RE, '$1' + item.fwdHost);
};

function isGroup(name) {
  return name && name[0] === '\r';
}

exports.isGroup = isGroup;

function filterJson(obj, keyword, filterType) {
  if (obj == null) {
    return false;
  }
  var type = typeof obj;
  var isKey = filterType === 1;
  var isVal = filterType > 1;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return !isKey && String(obj).toLowerCase().indexOf(keyword) !== -1;
  }
  if (type !== 'object') {
    return false;
  }
  if (Array.isArray(obj)) {
    var idx = [];
    for (var i = obj.length - 1; i >=0; i--) {
      if ((isVal || (i + '').indexOf(keyword) === -1) && !filterJson(obj[i], keyword, filterType)) {
        obj.splice(i, 1);
      } else {
        idx.push(i);
      }
    }
    obj._idx = idx.reverse();
    return obj.length;
  }
  Object.keys(obj).forEach(function(key) {
    var hasKey = !isVal && key.toLowerCase().indexOf(keyword) !== -1;
    if (isKey && hasKey) {
      return true;
    }
    if (!filterJson(obj[key], keyword, filterType) && !hasKey) {
      delete obj[key];
    }
  });
  return Object.keys(obj).length;
}

exports.filterJsonText = function(str, keyword, filterType) {
  keyword = keyword.trim().toLowerCase();
  var obj;
  if (keyword) {
    if (str.toLowerCase().indexOf(keyword) === -1) {
      return {};
    }
    obj = JSON.parse(str);
    filterJson(obj, keyword, filterType);
  }
  return obj;
};


var URL_RE = /^(?:([a-z0-9.+-]+:)?\/\/)?([^/?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i;
var HOST_RE = /^(.+)(?::(\d*))$/;
var BRACKET_RE = /^\[|\]$/g;

exports.parseUrl = function (url) {
  if (!URL_RE.test(url)) {
    return;
  }
  var protocol = RegExp.$1 || 'http:';
  var host = RegExp.$2;
  var pathname = RegExp.$3 || '/';
  var search = RegExp.$4;
  var hash = RegExp.$5 || null;
  var port = null;
  var hostname = host;
  if (HOST_RE.test(host)) {
    hostname = RegExp.$1;
    port = RegExp.$2;
  }

  return {
    protocol: protocol,
    slashes: true,
    auth: null,
    host: host,
    port: port,
    hostname: hostname.replace(BRACKET_RE, ''),
    hash: hash,
    search: search || null,
    query: search ? search.substring(1) : null,
    pathname: pathname,
    path: pathname + search,
    href: url
  };
};

exports.replacQuery = function(url, query) {
  var index = url.indexOf('#');
  var hash = '';
  if (index !== -1) {
    hash = url.substring(index);
    url = url.substring(0, index);
  }
  if (query) {
    query = '?' + query;
  }
  index = url.indexOf('?');
  if (index !== -1) {
    url = url.substring(0, index);
  }
  return url + query + hash;
};

exports.getDisplaySize = function(size, unzipSize) {
  unzipSize = size == unzipSize ? '' : getSize(unzipSize);
  size = getSize(size);
  return unzipSize ? size + ' / ' + unzipSize : size;
};

function formatSize(value) {
  return value >= 1024 ? value + ' (' + getSize(value) + ')' : value;
}

exports.formatSize = function(size, unzipSize) {
  var value = formatSize(size);
  if (size && unzipSize >= 0 && unzipSize != size) {
    value += ' / ' + formatSize(unzipSize);
    value += (unzipSize ? ' = ' + Number((size * 100) / unzipSize).toFixed(2) + '%' : '');
  }
  return value;
};


exports.getTabIcon = function (tab) {
  return tab.icon && getPluginCgiUrl(tab.plugin, tab.icon);
};

exports.getPluginIcon = function (plugin, name) {
  var icon = plugin && plugin[name || 'favicon'];
  return icon && getPluginCgiUrl(plugin.moduleName, icon);
};

var IMPORT_URL_RE = /[?&#]data(?:_url|Url)=([^&#]+)(?:&|#|$)/;
exports.getDataUrl = function() {
  var result = IMPORT_URL_RE.exec(location.href);
  return result && decodeURIComponentSafe(result[1]).trim();
};

function getSimplePluginName(plugin) {
  var name = typeof plugin === 'string' ? plugin : plugin.moduleName;
  return name.substring(name.lastIndexOf('.') + 1);
}

exports.getSimplePluginName = getSimplePluginName;

exports.showJSONDialog = function(data, keyPath) {
  var str = data && JSON.stringify(data);
  if (str) {
    events.trigger('showJsonViewDialog', [str, Array.isArray(keyPath) ? keyPath : null]);
  }
};

exports.handleFormat = function(e, onFormat) {
  if (e.shiftKey && e.keyCode === 70  && (e.metaKey || e.ctrlKey)) {
    onFormat(e);
    e.preventDefault();
  }
};

exports.handleTab = function(e) {
  var target = e.target;
  if (e.keyCode !== 9 || e.altKey || target.readOnly || target.disabled) {
    return;
  }
  e.preventDefault();
  var start = target.selectionStart;
  var end = target.selectionEnd;
  var value = target.value;
  target.value = value.substring(0, start) + '  ' + value.substring(end);
  target.selectionStart = target.selectionEnd = start + 2;
};

function getPluginCgiUrl(moduleName, url) {
  if (/^(?:https?:\/\/|data:image\/)/.test(url)) {
    return url;
  }
  moduleName = getSimplePluginName(moduleName);
  var pluginName = 'plugin.' + moduleName;
  if (url.indexOf('whistle.' + moduleName) === 0 || url.indexOf(pluginName) === 0) {
    return url;
  }
  return pluginName + '/' + url;
}

exports.getPluginCgiUrl = getPluginCgiUrl;

exports.showHandlePluginInfo = function(data, xhr) {
  if (!data) {
    showSystemError(xhr);
    return false;
  }
  message.success('Request successful - plugin list updating...');
  return true;
};

exports.getDialogTitle = function(name, action) {
  action = action || 'Import';
  switch (name) {
  case 'network':
    return action + ' Network Sessions';
  case 'networkSettings':
    return action + ' Network Settings';
  case 'composer':
    return action + ' Composer Data';
  case 'console':
    return action + ' Console Logs';
  case 'server':
    return action + ' Server Logs';
  case 'rules':
    return action + ' Rules';
  case 'rulesSettings':
    return action + ' Rules Settings';
  case 'values':
    return action + ' Values';
  case 'valuesSettings':
    return action + ' Values Settings';
  case 'mock':
    return action + ' Mock Data';
  default:
    return '';
  }
};

var CONTROL_RE =
  /[\u001e\u001f\u200e\u200f\u200d\u200c\u202a\u202d\u202e\u202c\u206e\u206f\u206b\u206a\u206d\u206c]+/g;
var MULTI_LINE_VALUE_RE =
  /^[^\n\r\S]*(```+)[^\n\r\S]*(\S+)[^\n\r\S]*[\r\n](?:([\s\S]*?)[\r\n])??[^\n\r\S]*\1\s*$/gm;

exports.resolveInlineValues = function(str, values, rawValues) {
  str = str && str.replace(CONTROL_RE, '').trim();
  if (!str || str.indexOf('```') === -1) {
    return str;
  }
  return str.replace(MULTI_LINE_VALUE_RE, function (all, _, key, value) {
    if (values[key] == null) {
      values[key] = value || '';
      if (rawValues) {
        rawValues[key] = all.trim();
      }
    }
    return '';
  });
};
