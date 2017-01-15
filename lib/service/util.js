var iconv = require('iconv-lite');

var STATUS_CODES = require('http').STATUS_CODES || {};
var TYPES = ['whistle', 'Fiddler'];

function getMethod(method) {
  if (typeof method !== 'string') {
    return 'GET';
  }
  return method.toUpperCase() || 'GET';
}

function getHeadersRaw(headers) {
  if (!headers) {
    return [];
  }
  delete headers.Host;
  return Object.keys(headers).map(function(name) {
    return name + ': ' + headers[name];
  });
}

function getReqRaw(req) {
  var headers = getHeadersRaw(req.headers);
  var url = String(req.url || '').replace(/^ws/, 'http');
  headers.unshift([getMethod(req.method), url, 'HTTP/1.1'].join(' '));
  return headers.join('\r\n') + '\r\n\r\n' + (req.body || '');
}

exports.getReqRaw = getReqRaw;

function getResRaw(res) {
  if (res.body && res.headers) {
    delete res.headers['content-encoding'];
    delete res.headers['transfer-encoding'];
  }
  var headers = getHeadersRaw(res.headers);
  headers.unshift(['HTTP/1.1', res.statusCode, res.statusMessage || STATUS_CODES[res.statusCode] || 'unknown'].join(' '));
  return headers.join('\r\n') + '\r\n\r\n' + (res.body || '');
}

exports.getResRaw = getResRaw;

var BODY_SEP = new Buffer('\r\n\r\n');

function getBodyOffset(raw) {
  var index = indexOfBuffer(raw, BODY_SEP);
  if (index !== -1) {
    return [index, index + 1];
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

var CHARSET_RE = /charset=([\w-]+)/i;
function getBody(body, charset) {
  if (!body) {
    return body;
  }
  if (CHARSET_RE.test(charset)) {
    charset = charset.$1;
  } else {
    charset = '';
  }
  if (charset) {
    try {
      body = iconv.decode(body, charset);
    } catch(e) {}
    return body + '';
  } else {
    var str = body.toString();
    if (str.indexOf('�') != -1) {
      return iconv.decode(body, 'gbk');
    } else {
      return str;
    }
  }
}

function parseRawData(raw) {
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
    headers[name.toLowerCase()] = value;
  });
  
  return {
    firstLine: firstLine,
    headers: headers,
    size: body ? body.length : 0,
    body: getBody(body, headers && headers['content-type'])
  };
}

function getReq(raw) {
  raw = parseRawData(raw);
  return raw ? {
    method: raw.firstLine[0],
    httpVersion: '1.1',
    url: raw.firstLine[1],
    headers: raw.headers,
    size: raw.size,
    body: raw.body
  } : null;
}

exports.getReq = getReq;

function getRes(raw) {
  raw = parseRawData(raw);
  return raw ? {
    statusCode: raw.firstLine[1],
    httpVersion: '1.1',
    statusMessage: raw.firstLine[2],
    headers: raw.headers,
    size: raw.size,
    body: raw.body
  } : {};
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

function getFilename(type) {
  if (!~TYPES.indexOf(type)) {
    type = 'whistle';
  }
  var date = new Date();
  var filename = [date.getFullYear(), padding(date.getMonth() + 1), padding(date.getDate())].join('-')
    + '_' + [padding(date.getHours()), padding(date.getMinutes()), padding(date.getSeconds())].join('-');
  return filename + (type === 'whistle' ? '.txt' : '.saz');
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
