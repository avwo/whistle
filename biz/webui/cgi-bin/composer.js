var http = require('http');
var gzip = require('zlib').gzip;
var tls = require('tls');
var crypto = require('crypto');
var Buffer = require('safe-buffer').Buffer;
var extend = require('extend');
var common = require('../../../lib/util/common');
var config = require('../../../lib/config');
var util = require('../../../lib/util');
var zlib = require('../../../lib/util/zlib');
var properties = require('../../../lib/rules/util').properties;
var getSender = require('ws-parser').getSender;
var hparser = require('hparser');

var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var parseReq = hparser.parse;
var MAX_LENGTH = 1024 * 512;
var MAX_REQ_COUNT = 100;
var TLS_PROTOS = 'https:,wss:,tls:'.split(',');
var PROXY_OPTS = {
  host: config.host || '127.0.0.1',
  port: config.port
};

function parseHeaders(headers, rawHeaderNames, clientId) {
  var type = headers && typeof headers;
  if (type != 'string' && type !== 'object') {
    return {};
  }

  var reqHeaders = type === 'object' ? headers : util.parseRawJson(headers);
  if (reqHeaders) {
    reqHeaders = util.lowerCaseify(reqHeaders, rawHeaderNames);
  } else {
    reqHeaders = util.parseHeaders(headers, rawHeaderNames);
  }
  if (clientId && reqHeaders[config.CLIENT_ID_HEADER] !== clientId) {
    reqHeaders[config.COMPOSER_CLIENT_ID_HEADER] = clientId;
  }
  return reqHeaders;
}

function drain(socket) {
  socket.on('error', util.noop);
  socket.on('data', util.noop);
}

function getReqCount(count) {
  return count > 0 ? Math.min(count, MAX_REQ_COUNT) : 1;
}

function handleConnect(options, cb, count) {
  count = getReqCount(count);
  options.headers['x-whistle-policy'] = 'tunnel';
  var origOpts = options;
  var lastIndex = count - 1;
  for (var i = 0; i < count; i++) {
    var execCb;
    if (i === lastIndex) {
      execCb = cb;
    } else {
      options = extend({}, origOpts);
    }
    config.connect({
      host: options.hostname,
      port: options.port || 443,
      proxyHost: PROXY_OPTS.host,
      proxyPort: PROXY_OPTS.port,
      headers: options.headers
    }, function(socket, svrRes, err) {
      if (err) {
        return execCb && execCb(err);
      }
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
      execCb && execCb(null, {
        statusCode: svrRes.statusCode,
        headers: svrRes.headers
      });
    }).on('error', execCb || util.noop);
  }
}

function getReqRaw(options) {
  var headers = options.headers;
  var statusLine = options.method +' ' + (options.path || '/') +' ' + 'HTTP/1.1';
  var raw = [statusLine, getRawHeaders(headers)];
  return raw.join('\r\n') + '\r\n\r\n';
}

function handleWebSocket(options, cb, count) {
  count = getReqCount(count);
  if (options.protocol === 'https:' || options.protocol === 'wss:') {
    options.headers[config.HTTPS_FIELD] = 1;
  }
  var binary = !!options.headers['x-whistle-frame-binary'];
  delete options.headers['x-whistle-frame-binary'];
  var origOpts = options;
  var lastIndex = count - 1;
  for (var i = 0; i < count; i++) {
    var execCb;
    if (i === lastIndex) {
      execCb = cb;
    } else {
      options = extend({}, origOpts);
    }
    util.connect(PROXY_OPTS, function(err, socket) {
      if (err) {
        execCb && execCb(err);
      } else {
        socket.write(getReqRaw(options));
        var data = options.body;
        if ((!data || !data.length) && !cb) {
          return drain(socket);
        }
        parseReq(socket, function(e) {
          if (e) {
            socket.destroy();
            return execCb && execCb(e);
          }
          var statusCode = socket.statusCode;
          if (statusCode == 101) {
            if (data) {
              if (common.isWebSocket(socket.headers)) {
                getSender(socket).send(data, {
                  mask: true,
                  binary: binary
                }, util.noop);
              } else {
                socket.write(data);
              }
              options.body = data = null;
            }
            socket.body = '';
            drain(socket);
          } else {
            socket.destroy();
          }
          execCb && execCb(null, {
            statusCode: statusCode,
            headers: socket.headers || {},
            body: socket.body || ''
          });
        }, true);
      }
    });
  }
}

function handleHttp(options, cb, count) {
  count = getReqCount(count);
  if (options.protocol === 'https:') {
    options.headers[config.HTTPS_FIELD] = 1;
  }
  options.protocol = null;
  options.hostname = null;
  options.host = PROXY_OPTS.host;
  options.port = PROXY_OPTS.port;
  var origOpts = options;
  var lastIndex = count - 1;
  for (var i = 0; i < count; i++) {
    var execCb;
    if (i === lastIndex) {
      execCb = cb;
    } else {
      options = extend({}, origOpts);
    }
    var client = http.request(options, function(res) {
      if (execCb) {
        res.on('error', execCb);
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
            execCb(null, result);
          });
        });
      } else {
        drain(res);
      }
    });
    client.on('error', execCb || util.noop);
    client.end(options.body);
    options.body = null;
  }
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
  var clientId = req.headers[config.CLIENT_ID_HEADER];
  var headers = parseHeaders(req.body.headers, rawHeaderNames, clientId);
  var method = util.getMethod(req.body.method);
  var isWebSocket = method === 'WEBSOCKET';
  delete headers[config.WEBUI_HEAD];
  headers[config.REQ_FROM_HEADER] = 'W2COMPOSER';
  headers.host = options.host;
  options.clientId = clientId;
  var clientIp = util.getClientIp(req);
  if (!util.isLocalAddress(clientIp)) {
    headers[config.CLIENT_IP_HEAD] = clientIp;
  }
  headers[config.CLIENT_PORT_HEAD] = util.getClientPort(req);
  options.method = method;

  var isConn = common.isConnect(options);
  var isWs = !isConn && (isWebSocket || common.isUpgrade(options, headers));
  var useH2 = req.body.useH2 || req.body.isH2;
  req.body.useH2 = false;
  if (isWs) {
    headers.connection = 'Upgrade';
    headers.upgrade = (!isWebSocket && headers.upgrade) || 'websocket';
    headers['sec-websocket-version'] = 13;
    if (isWebSocket || common.isWebSocket(headers)) {
      headers['sec-websocket-key'] = crypto.randomBytes(16).toString('base64');
    }
  } else {
    headers.connection = 'close';
    delete headers.upgrade;
    if (!isConn && ((useH2 && (protocol === 'https:' || protocol === 'http:')) || protocol === 'h2:' || protocol === 'http2:')) {
      req.body.useH2 = true;
      var isHttp = protocol === 'http:';
      options.protocol = isHttp ? 'http:' : 'https:';
      headers[config.ALPN_PROTOCOL_HEADER] = isHttp ? 'httpH2' : 'h2';
    }
  }
  !req.body.noStore && properties.addHistory(req.body);

  var getBody = function(cb) {
    var base64 = req.body.base64;
    var body = base64 || req.body.body;
    if (!isWs) {
      delete headers.trailer;
    }
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
    var count = req.body.repeatCount;
    count = count > 0 ? count : req.body.repeatTimes;
    if (isWs) {
      options.method = 'GET';
      handleWebSocket(options, handleResponse, count);
    } else if (isConn) {
      handleConnect(options, handleResponse, count);
    } else  {
      handleHttp(options, handleResponse, count);
    }
    if (!handleResponse) {
      res.json({ec: 0, em: 'success'});
    }
  });
};
