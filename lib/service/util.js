var STATUS_CODES = require('http').STATUS_CODES || {};

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
  return Object.keys(headers).map(function(name) {
    return name + ': ' + headers[name];
  });
}

function getReqRaw(req) {
  var headers = getHeadersRaw(req.headers);
  headers.unshift([getMethod(req.method), req.path, 'HTTP/1.1'].join(' '));
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
  return {
    method: raw.firstLine[0],
    httpVersion: '1.1',
    url: raw.firstLine[1],
    headers: raw.headers,
    body: raw.body
  };
}

exports.getReq = getReq;

function getRes(raw) {
  raw = foratRawData(raw);
  return {
    statusCode: raw.firstLine[1],
    httpVersion: '1.1',
    statusMessage: raw.firstLine[2],
    headers: raw.headers,
    body: raw.body
  };
}

exports.getRes = getRes;

function getMetaInfo(info) {
  
}

exports.getMetaInfo = getMetaInfo;
