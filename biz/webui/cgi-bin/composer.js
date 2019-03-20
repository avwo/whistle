var http = require('http');
var config = require('../../../lib/config');
var util = require('../../../lib/util');
var zlib = require('../../../lib/util/zlib');
var properties = require('../../../lib/rules/util').properties;
var getSender = require('ws-parser').getSender;
var hparser = require('hparser');

var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;
var STATUS_CODE_RE = /^\S+\s+(\d+)/i;
var MAX_LENGTH = 1024 * 512;
var PROXY_OPTS = {
  host: '127.0.0.1',
  port: config.port
};

function parseHeaders(headers, rawHeaderNames) {
  if (!headers || typeof headers != 'string') {
    return {};
  }

  var reqHeaders = util.parseRawJson(headers);
  if (reqHeaders) {
    return util.lowerCaseify(reqHeaders, rawHeaderNames);
  }

  return util.parseHeaders(headers, rawHeaderNames);
}

function isWebSocket(options) {
  var p = options.protocol;
  return p === 'ws:' || p === 'wss:';
}

var crypto = require('crypto');
function isConnect(options) {
  if (options.method === 'CONNECT') {
    return true;
  }
  var p = options.protocol;
  return p === 'connect:' || p === 'socket:' || p === 'tunnel:' || p === 'conn:';
}

function drain(socket) {
  socket.on('error', util.noop);
  socket.on('data', util.noop);
}

function handleConnect(options, cb) {
  options.headers['x-whistle-policy'] = 'tunnel';
  config.connect({
    host: options.hostname,
    port: options.port || 443,
    proxyHost: '127.0.0.1',
    proxyPort: config.port,
    headers: options.headers
  }, function(socket, res, err) {
    drain(socket);
    var data = util.toBuffer(options.body, getCharset(options.headers));
    if (data && data.length) {
      socket.write(data);
    }
    if (cb) {
      cb(err);
      util.onSocketEnd(socket, function(err) {
        cb(err || new Error('Closed'));
      });
    }
  }).on('error', cb || util.noop);
}

function getReqRaw(options) {
  var headers = options.headers;
  var statusLine = options.method +' ' + (options.path || '/') +' ' + 'HTTP/1.1';
  var raw = [statusLine, getRawHeaders(headers)];
  return raw.join('\r\n') + '\r\n\r\n';
}

function handleWebSocket(options, cb) {
  if (options.protocol === 'https:' || options.protocol === 'wss:') {
    options.headers[config.HTTPS_FIELD] = 1;
  }
  var binary = !!options.headers['x-whistle-frame-binary'];
  delete options.headers['x-whistle-frame-binary'];
  util.connect(PROXY_OPTS, function(err, socket) {
    if (err) {
      cb && cb(err);
    } else {
      socket.write(getReqRaw(options));
      var handleResponse = function(resData) {
        resData = resData + '';
        var index = resData.indexOf('\r\n\r\n');
        if (index !== -1) {
          socket.removeListener('data', handleResponse);
          socket.headers = parseHeaders(resData.slice(0, index));
          var sender = getSender(socket);
          var data = util.toBuffer(options.body, getCharset(socket.headers) || getCharset(options.headers));
          if (data && data.length) {
            sender.send(data, {
              mask: true,
              binary: binary
            }, util.noop);
          }
        }
        if (cb) {
          var statusCode = 0;
          if (STATUS_CODE_RE.test(resData)) {
            statusCode = parseInt(RegExp.$1, 10);
          }
          cb(null, {
            statusCode: statusCode,
            headers: socket.headers || {},
            body: ''
          });
        }
      };
      socket.on('data', handleResponse);
      if (cb) {
        util.onSocketEnd(socket, function(err) {
          cb(err || new Error('Closed'));
        });
      }
      drain(socket);
    }
  });
}

function handleHttp(options, cb) {
  if (options.protocol === 'https:') {
    options.headers[config.HTTPS_FIELD] = 1;
  }
  options.protocol = null;
  options.hostname = null;
  options.host = '127.0.0.1';
  options.port = config.port;
  http.request(options, function(res) {
    if (cb) {
      res.on('error', cb);
      var buffer;
      res.on('data', function(data) {
        if (buffer !== null) {
          buffer = buffer ? Buffer.concat([buffer, data]) : data;
          if (buffer.length > MAX_LENGTH) {
            buffer = null;
          }
        }
      });
      res.on('end', function() {
        zlib.unzip(res.headers['content-encoding'], buffer, function(err, body) {
          cb(null, {
            statusCode: res.statusCode,
            headers: res.headers,
            body: err ? err.stack : util.decodeBuffer(body)
          });
        });
      });
    } else {
      drain(res);
    }
  }).on('error', cb || util.noop).end(options.body);
}

function getCharset(headers) {
  var charset = headers && headers['x-whistle-charset'];
  return charset || util.getCharset(headers['content-type']);
}

module.exports = function(req, res) {
  var fullUrl = req.body.url;
  if (!fullUrl || typeof fullUrl !== 'string') {
    return res.json({ec: 0});
  }

  fullUrl = util.encodeNonLatin1Char(fullUrl.replace(/#.*$/, ''));
  var options = util.parseUrl(util.setProtocol(fullUrl));
  if (!options.host) {
    return res.json({ec: 0});
  }
  properties.addHistory(req.body);
  var rawHeaderNames = {};
  var headers = parseHeaders(req.body.headers, rawHeaderNames);
  delete headers[config.WEBUI_HEAD];
  if (!headers['user-agent']) {
    headers['user-agent'] = config.PROXY_UA;
  }
  headers[config.WHISTLE_REQ_FROM_HEADER] = 'W2COMPOSER';
  headers.host = options.host;
  var clientIp = util.getClientIp(req);
  if (!util.isLocalAddress(clientIp)) {
    headers[config.CLIENT_IP_HEAD] = clientIp;
  }
  headers[config.CLIENT_PORT_HEAD] = util.getClientPort(req);
  options.method = util.getMethod(req.body.method);

  var isConn = isConnect(options);
  var isWs = !isConn && (isWebSocket(options)
    || (/upgrade/i.test(headers.connection) && /websocket/i.test(headers.upgrade)));
  if (isWs) {
    headers.connection = 'Upgrade';
    headers.upgrade = 'websocket';
    headers['sec-websocket-version'] = 13;
    headers['sec-websocket-key'] = crypto.randomBytes(16).toString('base64');
  } else {
    headers.connection = 'close';
    delete headers.upgrade;
  }

  var base64 = req.body.base64;
  var body = base64 || req.body.body;
  if (body && (isWs || isConn || util.hasRequestBody(options))) {
    body = util.toBuffer(body, base64 ? 'base64' : getCharset(headers));
    options.body = body;
    if ('content-length' in headers) {
      if (isWs || isConn) {
        delete headers['content-length'];
      } else {
        headers['content-length'] = body ? body.length : '0';
      }
    }
  } else {
    delete headers['content-length'];
  }
  delete headers['content-encoding'];
  options.headers = formatHeaders(headers, rawHeaderNames);
  var done;
  var needResponse = req.query.needResponse || req.body.needResponse;
  var handleResponse = needResponse ? function(err, data) {
    if (done) {
      return;
    }
    done = true;
    if (err) {
      res.json({ec: 0, res: {
        statusCode:  err.statusCode ? parseInt(err.statusCode, 10) : 502,
        headers: '',
        body: err.stack
      }});
      return;
    }
    res.json({ec: 0, em: 'success', res: data || ''});
  } : null;
  if (isWs) {
    options.method = 'GET';
    if (handleResponse) {
      return handleWebSocket(options, handleResponse);
    }
    handleWebSocket(options);
  } else if (isConn) {
    if (handleResponse) {
      return handleConnect(options, handleResponse);
    }
    handleConnect(options);
  } else  {
    if (handleResponse) {
      return handleHttp(options, handleResponse);
    }
    handleHttp(options);
  }
  res.json({ec: 0, em: 'success'});
};
