var PassThrough = require('stream').PassThrough;
var TIMEOUT = 36000;
var MAX_BYTES = 1024 * 256;
var CRLF_BUF = toBuffer('\r\n');

function toBuffer(buf) {
  return new Buffer(buf);
}

function parsePairs(pairs, buffer) {
  var rawHeaders = [];
  for (var i = 0, len = buffer.length; i < len; i++) {
    var pair = getPair(buffer[i], rawHeaders);
    if (pair) {
      var value = pairs[pair.key];
      if (value) {
        if (!Array.isArray(value)) {
          value = [value];
        }
        value.push(pair.value);
      }
      pairs[pair.key] = value || pair.value;
    }
  }

  return rawHeaders;
}

function getPair(line, rawHeaders) {
  if (!(line = line && line.trim())) {
    return;
  }

  var index = line.indexOf(':');
  var key = line.substring(0, index).trim();
  var value = line.substring(index + 1).trim();
  rawHeaders.push(key, value);
  return index != -1 ? {
    key: key.toLowerCase(),
    value: value
  } : null;
}

function endIndexOf(buffer, start, end) {
  start = start || 0;
  end = end || buffer.length;
  for (; start < end; start++) {
    if (buffer[start] == CRLF_BUF[0] && buffer[start + 1] == CRLF_BUF[1]
&& buffer[start + 2] == CRLF_BUF[0] && buffer[start + 3] == CRLF_BUF[1]) {
      return start;
    }
  }

  return -1;
}

function formatHeaders(headers, rawHeaders) {
  if (!rawHeaders) {
    return headers;
  }
  var newHeaders = {};
  if (Array.isArray(rawHeaders)) {
    var rawHeadersMap = {};
    for (var i = 0, len = rawHeaders.length; i < len; i += 2) {
      var name = rawHeaders[i];
      if (typeof name === 'string') {
        rawHeadersMap[name.toLowerCase()] = name;
      }
    }
    rawHeaders = rawHeadersMap;
  }
  Object.keys(headers).forEach(function(name) {
    newHeaders[rawHeaders[name] || name] = headers[name];
  });
  return newHeaders;
}

function getRawHeaderNames(rawHeaders) {
  var rawHeaderNames = {};
  for (var i = 0, len = rawHeaders.length; i < len; i += 2) {
    var name = rawHeaders[i];
    if (typeof name === 'string') {
      rawHeaderNames[name.toLowerCase()] = name;
    }
  }
  return rawHeaderNames;
}

module.exports = function parseReq(socket, callback, readBuffer, neadModifyHeaders) {
  if (typeof readBuffer == 'boolean') {
    var temp = neadModifyHeaders;
    neadModifyHeaders = readBuffer;
    readBuffer = temp;
  }

  var timeoutId, buffer;
  socket.on('error', callback);
  socket.on('data', parseData);
  readBuffer && parseData(readBuffer);

  function parseData(data) {
    clearTimeout(timeoutId);
    buffer = buffer ? Buffer.concat([buffer, data]) : data;
    var endIndex = endIndexOf(buffer);
    if (endIndex == -1) {
      if (buffer.length > MAX_BYTES) {
        callback(new Error('Parse error'));
      } else {
        timeoutId = setTimeout(showTimeout, TIMEOUT);
      }
      return;
    }

    socket.removeListener('data', parseData);
    var req = neadModifyHeaders ? socket : new PassThrough();
    var headers = {};
    var rawHeaders = buffer.slice(0, endIndex).toString().trim().split(/\r\n/g);
    var firstLine = rawHeaders.shift();
    var status = firstLine.split(/\s/g);
    rawHeaders = socket.rawHeaders = parsePairs(headers, rawHeaders);

    req.method = status[0] = status[0] || 'GET';
    req.url = status[1] || '/';
    req.statusCode = status[1] || 0;
    req.httpVersion = status[2] && status[2].split('/')[1] || '1.1';
    req.headers = headers;

    if (neadModifyHeaders) {
      req.getBuffer = function(headers, path) {
        if (!headers) {
          return buffer;
        }
        if (path) {
          status[1] = path;
          path = status.join(' ');
        }
        var rawData = [path || firstLine];
        headers = formatHeaders(headers, rawHeaders);
        Object.keys(headers).forEach(function(key) {
          var value = headers[key];
          value && rawData.push(key + ':' +  value);
        });

        return Buffer.concat([toBuffer(rawData.join('\r\n')), buffer.slice(endIndex)]);
      };
    } else {
      req.on('error', function () {
        socket.destroy();
      });
      req.destroy = function() {
        socket.destroy();
      };
      req.socket = socket;
      req.write(buffer);
      socket.pipe(req);
    }

    callback(null, req);
  }

  function showTimeout() {
    callback(new Error('Timeout'));
  }
};

module.exports.formatHeaders = formatHeaders;
module.exports.getRawHeaderNames = getRawHeaderNames;
