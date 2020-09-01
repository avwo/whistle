var http = require('http');
var gzip = require('zlib').gzip;
var tls = require('tls');
var Buffer = require('safe-buffer').Buffer;
var config = require('../../../lib/config');
var util = require('../../../lib/util');
var zlib = require('../../../lib/util/zlib');
var properties = require('../../../lib/rules/util').properties;
var getSender = require('ws-parser').getSender;
var hparser = require('hparser');

var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var BODY_SEP = Buffer.from('\r\n\r\n');
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
  return p === 'ws:' || p === 'wss:' || options.method === 'UPGRADE';
}

var crypto = require('crypto');
var CONNECT_PROTOS = 'connect:,socket:,tunnel:,conn:,tls:,tcp:'.split(',');
var TLS_PROTOS = 'https:,wss:,tls:'.split(',');
function isConnect(options) {
  if (options.method === 'CONNECT') {
    return true;
  }
  var p = options.protocol;
  return CONNECT_PROTOS.indexOf(p) !== -1;
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
  }, function(socket, _, err) {
    if (!err) {
      if (TLS_PROTOS.indexOf(options.protocol) !== -1) {
        socket = tls.connect({
          rejectUnauthorized: config.rejectUnauthorized,
          socket: socket,
          servername: options.hostname
        });
      }
      drain(socket);
      var data = options.body;
      if (data && data.length) {
        socket.write(data);
        options.body = data = null;
      }
    }
    cb && cb(err);
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
        var index = util.indexOfList(resData, BODY_SEP);
        var body = '';
        if (index !== -1) {
          socket.removeListener('data', handleResponse);
          socket.headers = parseHeaders(resData.slice(0, index) + '');
          body = resData.slice(index + 4);
          var sender = getSender(socket);
          var data = options.body;
          if (data && data.length) {
            sender.send(data, {
              mask: true,
              binary: binary
            }, util.noop);
            options.body = data = null;
          }
        }
        if (cb) {
          var statusCode = 0;
          if (STATUS_CODE_RE.test(resData)) {
            statusCode = parseInt(RegExp.$1, 10);
          }
          if (statusCode !== 101) {
            socket.destroy();
          }
          var result = {
            statusCode: statusCode,
            headers: socket.headers || {}
          };
          if (body) {
            result.base64 = body.toString('base64');
          }
          cb(null, result);
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
  var client = http.request(options, function(res) {
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
          var headers = res.headers;
          if (typeof headers.trailer === 'string' && headers.trailer.indexOf(',') !== -1) {
            headers.trailer = headers.trailer.split(',');
          }
          var result = {
            statusCode: res.statusCode,
            headers: headers,
            trailers: res.trailers,
            rawHeaderNames: getRawHeaderNames(res.rawHeaders),
            rawTrailerNames: getRawHeaderNames(res.rawTrailers)
          };
          if (err) {
            result.body = err.stack;
          } else if (body) {
            result.base64 = body.toString('base64');
          }
          cb(null, result);
        });
      });
    } else {
      drain(res);
    }
  });
  client.on('error', cb || util.noop);
  client.end(options.body);
  options.body = null;
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
  var protocol = options.protocol;
  if (protocol) {
    options.protocol = protocol = protocol.toLowerCase();
  }
  var rawHeaderNames = {};
  var headers = parseHeaders(req.body.headers, rawHeaderNames);
  delete headers[config.WEBUI_HEAD];
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
    || (/^\s*upgrade\s*$/i.test(headers.connection) && /^\s*websocket\s*$/i.test(headers.upgrade)));
  var useH2 = req.body.useH2;
  req.body.useH2 = false;
  if (isWs) {
    headers.connection = 'Upgrade';
    headers.upgrade = 'websocket';
    headers['sec-websocket-version'] = 13;
    headers['sec-websocket-key'] = crypto.randomBytes(16).toString('base64');
  } else {
    headers.connection = 'close';
    delete headers.upgrade;
    if (!isConn && ((useH2 && protocol === 'https:') || protocol === 'h2:' || protocol === 'http2:')) {
      req.body.useH2 = true;
      options.protocol = protocol = 'https:';
      headers[config.ALPN_PROTOCOL_HEADER] = 'h2';
    }
  }
  !req.body.noStore && properties.addHistory(req.body);

  var getBody = function(cb) {
    var base64 = req.body.base64;
    var body = base64 || req.body.body;
    if (isWs || isConn || util.hasRequestBody(options)) {
      body = body && util.toBuffer(body, base64 ? 'base64' : getCharset(headers));
      options.body = body;
      if (!isWs && !isConn && body && req.body.isGzip) {
        gzip(body, function(err, gzipData) {
          if (err) {
            return cb(err);
          }
          headers['content-encoding'] = 'gzip';
          if ('content-length' in headers) {
            headers['content-length'] = gzipData.length;
          } else {
            delete headers['content-length'];
          }
          options.body = gzipData;
          cb();
        });
        return;
      }
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
    cb();
  };
  getBody(function(err) {
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
    if (err) {
      return handleResponse && handleResponse(err);
    }
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
  });
};
