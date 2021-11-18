var Buffer = require('safe-buffer').Buffer;
var zlib = require('../util/zlib');

var STATUS_CODES = require('http').STATUS_CODES || {};
var wsParser = require('ws-parser');

var CRLF = Buffer.from('\r\n');
var TYPE_RE = /(request|response)-length:/i;
var frameIndex = 100000;
var TYPES = ['whistle', 'Fiddler', 'har'];

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

function getMethod(method) {
  if (typeof method !== 'string') {
    return 'GET';
  }
  return method.trim().toUpperCase() || 'GET';
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

function decodeRaw(headers, data) {
  var body = getBodyBuffer(data);
  var raw = Buffer.from(headers.join('\r\n') + '\r\n\r\n');
  return body ? Buffer.concat([raw, body]) : raw;
}

function removeEncodingFields(headers) {
  if (headers) {
    delete headers['content-encoding'];
    delete headers['transfer-encoding'];
  }
}

function getBodyBuffer(data) {
  if (data.base64) {
    try {
      return Buffer.from(data.base64 + '', 'base64');
    } catch(e) {}
    return Buffer.from(data.base64 + '');
  }
  if (data.body) {
    return Buffer.from(data.body + '');
  }
}

function getReqRaw(req) {
  removeEncodingFields(req.headers);
  var headers = getHeadersRaw(req.headers, req.rawHeaderNames);
  var url = String(req.url || '').replace(/^ws/, 'http');
  headers.unshift([getMethod(req.method), url, 'HTTP/1.1'].join(' '));
  return decodeRaw(headers, req);
}

exports.getReqRaw = getReqRaw;

function getResRaw(res) {
  removeEncodingFields(res.headers);
  var headers = getHeadersRaw(res.headers, res.rawHeaderNames);
  var statusCode = res.statusCode === 'aborted' ? 502 : res.statusCode;
  var statusMessage = !statusCode ? '' : res.statusMessage || STATUS_CODES[statusCode] || 'unknown';
  headers.unshift(['HTTP/1.1', statusCode, statusMessage].join(' '));
  return decodeRaw(headers, res);
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

  zlib.unzip(headers['content-encoding'], body, function(err, result) {
    if (!err && result) {
      body = result;
    }
    return callback(body && body.toString('base64'));
  });
}

function parseRawData(raw, callback) {
  var offset = getBodyOffset(raw);
  var body = '';
  if (offset) {
    body = raw.slice(offset[1]);
    raw = raw.slice(0, offset[0]);
  }
  raw = raw.toString();
  raw = raw.trim().split(/\r\n?|\n/);
  var statusLine = raw.shift().split(/\s+/);
  var firstLine = statusLine.splice(0, 2);
  firstLine[2] = statusLine.join(' ');
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
    var key = name.toLowerCase();
    var value = headers[key];
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
    rawHeaderNames[key] = name;
    headers[key] = value;
  });

  getBody(body, headers, function(base64) {
    callback({
      firstLine: firstLine,
      headers: headers,
      size: base64 ? base64.length : 0,
      rawHeaderNames: rawHeaderNames,
      base64: base64
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
      base64: raw.base64
    } : null);
  });
}

exports.getReq = getReq;

function getRes(raw, callback) {
  parseRawData(raw, function(raw) {
    callback(raw ? {
      statusCode: raw.firstLine[1],
      httpVersion: '1.1',
      rawHeaderNames: raw.rawHeaderNames,
      statusMessage: raw.firstLine[2],
      headers: raw.headers,
      size: raw.size,
      base64: raw.base64
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
  if (TYPES.indexOf(type) === -1) {
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
  } else if (type === 'har') {
    if (filename) {
      if (!/\.har$/i.test(filename)) {
        filename += '.har';
      }
    } else {
      filename = 'har_' + formatDate() + '.har';
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

function removeIPV6Prefix(ip) {
  if (typeof ip != 'string') {
    return '';
  }

  return ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
}

exports.removeIPV6Prefix = removeIPV6Prefix;

function getIndex() {
  if (frameIndex > 10000000) {
    frameIndex = 100000;
  }
  return ++frameIndex;
}

function noop() {}

function resolveFrames(res, frames, callback) {
  var len = frames.length;
  var result = [];
  if (!len) {
    return callback(result);
  }
  res.headers = res.headers || {};
  var receiver = wsParser.getReceiver(res);
  var execCallback = function() {
    if (receiver) {
      receiver.onData = noop;
      receiver = null;
      callback(result);
    }
  };
  var index = 0;
  receiver.onerror = execCallback;
  receiver.onclose = execCallback;
  receiver.onData = function(chunk, opts) {
    var frame = frames[index];
    ++index;
    if (frame) {
      result.push({
        frameId: frame.frameId,
        isClient: frame.type === 'request',
        mask: opts.mask,
        base64: chunk.toString('base64'),
        compressed: opts.compressed,
        length: opts.length,
        opcode: opts.opcode
      });
    }
    if (!frame || len === index) {
      setImmediate(execCallback);
    }
  };
  setTimeout(execCallback, 3000);
  frames.forEach((frame) => {
    receiver.add(frame.bin);
  });
}

function parseFrames(res, content, callback) {
  var end = content.indexOf(CRLF, 0);
  var start = 2;
  var frames = [];

  while(end !== -1) {
    var line = content.slice(start, end).toString();
    if (TYPE_RE.test(line)) {
      var frame = { type: RegExp.$1.toLowerCase() };
      frame.length = line.substring(line.indexOf(':') + 1).trim();
      start = content.indexOf(CRLF, start + 90);
      if (start === -1) {
        break;
      }
      start += 2;
      end = content.indexOf(CRLF, start);
      if (end === -1) {
        break;
      }
      line = content.slice(start, end).toString();
      var time = new Date(line.substring(line.indexOf(':') + 1).trim() || 0).getTime();
      frame.frameId = time + '-' + getIndex();
      start = end + 4;
      end = content.indexOf(CRLF, start);
      if (end === -1) {
        break;
      }
      frame.bin = content.slice(start, end);
      frames.push(frame);
    }
    start = end + 2;
    end = content.indexOf(CRLF, start);
  }
  resolveFrames(res, frames, callback);
}

exports.parseFrames = parseFrames;
