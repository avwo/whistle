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
  var url = String(req.url || '').replace('ws', 'http');
  headers.unshift([getMethod(req.method), url, 'HTTP/1.1'].join(' '));
  return headers.join('\r\n') + '\r\n\r\n' + (req.body || '');
}

exports.getReqRaw = getReqRaw;

function getResRaw(res) {
  var headers = getHeadersRaw(res.headers);
  headers.unshift(['HTTP/1.1', res.statusCode, res.statusMessage || STATUS_CODES[res.statusCode] || 'unknown'].join(' '));
  return headers.join('\r\n') + '\r\n\r\n' + (res.body || '');
}

exports.getResRaw = getResRaw;

var BODY_SEP = /\r\n?\r\n?|\n\r\n?|\n\n/;

function foratRawData(raw) {
  if (typeof raw !== 'string' || !(raw = raw.trim())) {
    return;
  }
  var index = BODY_SEP.exec(raw);
  var body = '';
  if (index) {
    index = index[0].index;
    body = raw.substring(index).replace(BODY_SEP, '');
    raw = raw.substring(0, index);
  }
  raw = raw.trim().split(/\r\n?|\n/g);
  var firstLine = raw.shift().split(/\s+/g);
  var headers = {};
  raw.forEach(function(line) {
    index = /\s*:\s*/.exec(line);
    if (!index) {
      return;
    }
    
    index = index[0].index;
    var name = line.substring(0, index).trim();
    if (!name) {
      return;
    }
    
    var value = headers[name];
    if (value != null) {
      if (Array.isArray(value)) {
        value.push(name);
      } else {
        value = [value, name];
      }
    } else {
      value = name;
    }
    headers[name] = value;
  });
  
  return {
    firstLine: firstLine,
    headers: headers,
    body: body
  };
}

function getReq(raw) {
  raw = foratRawData(raw);
  return raw ? {
    method: raw.firstLine[0],
    httpVersion: '1.1',
    url: raw.firstLine[1],
    headers: raw.headers,
    body: raw.body
  } : {};
}

exports.getReq = getReq;

function getRes(raw) {
  raw = foratRawData(raw);
  return raw ? {
    statusCode: raw.firstLine[1],
    httpVersion: '1.1',
    statusMessage: raw.firstLine[2],
    headers: raw.headers,
    body: raw.body
  } : {};
}

exports.getRes = getRes;

function getMetaInfo(info) {
  
}

exports.getMetaInfo = getMetaInfo;

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
