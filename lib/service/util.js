var iconv = require('iconv-lite');
var Buffer = require('safe-buffer').Buffer;
var zlib = require('../util/zlib');

var STATUS_CODES = require('http').STATUS_CODES || {};
var CRLF = Buffer.from('\r\n');
var IMG_RE = /image\//i;
var IMG_BASE64_SPE = ';base64,';

var TYPES = ['whistle', 'Fiddler'];
var CHARSET_RE = /charset=([\w-]+)/i;

function getCharset(type) {
  return CHARSET_RE.test(type) ? RegExp.$1 : '';
}

function dechunkify(body) {
  var result = [];
  var index;
  while((index = indexOfBuffer(body, CRLF)) > 0) {
    var size = parseInt(body.slice(0, index).toString(), 16) || 0;
    if (!size) {
      break;
    }
    index += 2;
    result.push(body.slice(index, index += size));
    body = body.slice(index + 2);
  }
  return result.length ? Buffer.concat(result) : body;
}

function unzip(encoding, body, callback) {
  if (body && typeof encoding === 'string') {
    encoding = encoding.trim().toLowerCase();
    if (encoding === 'gzip') {
      return zlib.gunzip(body, callback);
    }
    if (encoding === 'deflate') {
      return zlib.inflate(body, function(err, data) {
        err ? zlib.inflateRaw(body, callback) : callback(null, data);
      });
    }
  }
  return callback(null, body);
}

function getMethod(method) {
  if (typeof method !== 'string') {
    return 'GET';
  }
  return method.toUpperCase() || 'GET';
}

function getHeadersRaw(headers, rawHeaderNames) {
  var result = [];
  if (headers) {
    rawHeaderNames = rawHeaderNames || {};
    Object.keys(headers).forEach(function(name) {
      var value = headers[name];
      var key = rawHeaderNames[name] || name;
      if (!Array.isArray(value)) {
        result.push(key + ': ' + value);
        return;
      }
      value.forEach(function(val) {
        result.push(key + ': ' + val);
      });
    });
  }
  return result;
}

function decodeRaw(type, headers, body) {
  var charset = getCharset(type).toLowerCase();
  var raw = Buffer.from(headers.join('\r\n') + '\r\n\r\n');
  if (body) {
    var imgBody;
    if (IMG_RE.test(type)) {
      try {
        var index = body.indexOf(IMG_BASE64_SPE);
        imgBody = index === -1 ? body : body.substring(index + IMG_BASE64_SPE.length);
        imgBody = Buffer.from(imgBody, 'base64');
      } catch(e) {}
    } else if (charset && charset !== 'utf8' && charset !== 'utf-8') {
      try {
        return Buffer.concat([raw, iconv.encode(body, charset)]);
      } catch(e) {}
    }
    
    raw = Buffer.concat([raw, imgBody || Buffer.from(body)]);
  }
  return raw;
}

function removeEncodingFields(headers) {
  if (headers) {
    delete headers['content-encoding'];
    delete headers['transfer-encoding'];
  }
}

function getReqRaw(req) {
  removeEncodingFields(req.headers);
  var headers = getHeadersRaw(req.headers, req.rawHeaderNames);
  var url = String(req.url || '').replace(/^ws/, 'http');
  headers.unshift([getMethod(req.method), url, 'HTTP/1.1'].join(' '));
  return decodeRaw(req.headers && req.headers['content-type'], headers, req.body);
}

exports.getReqRaw = getReqRaw;

function getResRaw(res) {
  removeEncodingFields(res.headers);
  var headers = getHeadersRaw(res.headers, res.rawHeaderNames);
  var statusCode = res.statusCode === 'aborted' ? 502 : res.statusCode;
  var statusMessage = !statusCode ? '' : res.statusMessage || STATUS_CODES[statusCode] || 'unknown';
  headers.unshift(['HTTP/1.1', statusCode, statusMessage].join(' '));
  return decodeRaw(res.headers && res.headers['content-type'], headers, res.body);
}

exports.getResRaw = getResRaw;

var BODY_SEP = Buffer.from('\r\n\r\n');

function getBodyOffset(raw) {
  var index = indexOfBuffer(raw, BODY_SEP);
  if (index !== -1) {
    return [index, index + 4];
  }
}
function indexOfBuffer(buf, subBuf, start) {
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
}

function getBody(body, headers, callback) {
  if (body) {
    var chunked = headers['transfer-encoding'];
    if (typeof chunked === 'string') {
      chunked = chunked.trim().toLowerCase();
    }
    if (chunked === 'chunked') {
      body = dechunkify(body);
    }
  }

  unzip(headers['content-encoding'], body, function(err, result) {
    if (!err && result) {
      body = result;
    }
    var charset = getCharset(headers['content-type']);
    if (charset) {
      try {
        body = iconv.decode(body, charset);
      } catch(e) {}
      body += '';
    } else {
      var str = body.toString();
      if (str.indexOf('�') !== -1) {
        body = iconv.decode(body, 'GB18030');
        if (body.indexOf('�') !== -1) {
          body = str;
        }
      } else {
        body = str;
      }
    }
    callback(body);
  });
}

function parseRawData(raw, callback, isRes) {
  var offset = getBodyOffset(raw);
  var body = '';
  if (offset) {
    body = raw.slice(offset[1]);
    raw = raw.slice(0, offset[0]);
  }
  raw = raw.toString();
  raw = raw.trim().split(/\r\n?|\n/g);
  var firstLine = raw.shift().split(/\s+/g);
  var headers = {};
  var rawHeaderNames = {};
  raw.forEach(function(line) {
    var index = line.indexOf(':');
    if (index === -1) {
      return;
    }
    var name = line.substring(0, index).trim();
    if (!name) {
      return;
    }
    var value = headers[name];
    var val = line.substring(index + 1).trim();
    if (value != null) {
      if (Array.isArray(value)) {
        value.push(val);
      } else {
        value = [value, val];
      }
    } else {
      value = val;
    }
    var key = name.toLowerCase();
    rawHeaderNames[key] = name;
    headers[key] = value;
  });

  var type = 'TEXT';
  if (isRes) {
    type = getType(headers['content-type']);
  }
  getBody(type ? body : '', headers, function(body) {
    callback({
      firstLine: firstLine,
      headers: headers,
      size: body ? body.length : 0,
      rawHeaderNames: rawHeaderNames,
      body: body
    });
  });
}

function getReq(raw, callback) {
  raw = parseRawData(raw, function(raw) {
    var method = raw.firstLine[0] || 'GET';
    callback(raw ? {
      method: method,
      httpVersion: '1.1',
      rawHeaderNames: raw.rawHeaderNames,
      url: raw.firstLine[1],
      headers: raw.headers,
      size: /^get$/i.test(method) ? 0 : raw.size,
      body: raw.body
    } : null);
  });
}

exports.getReq = getReq;

function getType(type) {
  if (typeof type == 'string') {
    type = type.toLowerCase();
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
  } else if (!type) {
    return 'TEXT';
  }

  return null;
}

function getRes(raw, callback) {
  parseRawData(raw, function(raw) {
    callback(raw ? {
      statusCode: raw.firstLine[1],
      httpVersion: '1.1',
      rawHeaderNames: raw.rawHeaderNames,
      statusMessage: raw.firstLine[2],
      headers: raw.headers,
      size: raw.size,
      body: raw.body
    } : {});
  }, true);
}

exports.getRes = getRes;

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch(e) {}
}

exports.parseJSON = parseJSON;

function padding(num) {
  return num < 10 ? '0' + num : num;
}

function paddingMS(ms) {
  if (ms > 99) {
    return ms;
  }
  if (ms > 9) {
    return '0' + ms;
  }
  return '00' + ms;
}

function formatDate() {
  var date = new Date();
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

function getFilename(type, filename) {
  if (!~TYPES.indexOf(type)) {
    type = 'whistle';
  }
  if (typeof filename !== 'string') {
    filename = '';
  }
  if (type === 'whistle') {
    if (filename) {
      if (!/\.(json|txt)$/i.test(filename)) {
        filename += '.txt';
      }
    } else {
      filename = 'whistle_' + formatDate() + '.txt';
    }
  } else {
    if (filename) {
      if (!/\.saz$/i.test(filename)) {
        filename += '.saz';
      }
    } else {
      filename = 'fiddler_' + formatDate() + '.saz';
    }
  }
  return filename;
}

exports.getFilename = getFilename;

var ONE_MINUTE = 60 * 1000;
function toISOString(time) {
  var date = new Date();
  var offet = -date.getTimezoneOffset();
  time += offet * ONE_MINUTE;
  offet /= 60;
  time = time >= 0 ? new Date(time) : new Date();
  return time.toISOString().slice(0, -1) + '0000'
    + (offet >= 0 ? '+' : '-') + padding(Math.abs(offet)) + ':00';
}

exports.toISOString = toISOString;
