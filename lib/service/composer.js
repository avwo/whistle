var http = require('http');
var gzip = require('zlib').gzip;
var tls = require('tls');
var crypto = require('crypto');
var extend = require('extend');
var common = require('../util/common');
var getSender = require('ws-parser').getSender;
var hparser = require('hparser');
var composeData = require('./compose-data');
var Storage = require('../rules/storage');
var dataCenter = require('./data-center');

var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var config = {};
var noop = common.noop;
var parseReq = hparser.parse;
var MAX_LENGTH = 1024 * 2048;
var MAX_REQ_COUNT = 100;
var propertiesStorage;
var TLS_PROTOS = 'https:,wss:,tls:'.split(',');
var PROXY_OPTS = {};
var composerHistory = [];
var MAX_HISTORY_LEN = 100;
var MAX_URL_LEN = 10 * 1024;
var MAX_HEADERS_LEN = 128 * 1024;
var MAX_BODY_LEN = 260 * 1024;
var MAX_BASE64_LEN = 360 * 1024;
var MAX_METHOD_LEN = 64;

var composerTimer;
function saveComposerHistory() {
  composerTimer = null;
  try {
    propertiesStorage.writeFile('composerHistory', JSON.stringify(composerHistory));
  } catch (e) {}
}

function handleComposerHistory(data) {
  var url = data.url;
  var method = data.method;
  var headers = data.headers;
  var body = data.body;
  var base64 = data.base64;
  if (body || !base64 || typeof base64 !== 'string' || base64.length > MAX_BASE64_LEN) {
    base64 = undefined;
  }
  var result = {
    date: Date.now(),
    useH2: data.useH2,
    url: url.length > MAX_URL_LEN ? url.substring(0, MAX_URL_LEN) : url,
    method:
        method.length > MAX_METHOD_LEN
          ? method.substring(0, MAX_METHOD_LEN)
          : method,
    headers:
        headers.length > MAX_HEADERS_LEN
          ? headers.substring(0, MAX_HEADERS_LEN)
          : headers,
    body: body.length > MAX_BODY_LEN ? body.substring(0, MAX_BODY_LEN) : body,
    isHexText: !!data.isHexText,
    base64: base64,
    enableProxyRules: !!data.enableProxyRules
  };
  var dataHash;
  var base64Hash;
  for (var i = 0, len = composerHistory.length; i < len; i++) {
    var item = composerHistory[i];
    if (
        item.url === result.url &&
        item.method === result.method &&
        item.headers === result.headers &&
        item.body === result.body &&
        item.base64 === result.base64 &&
        !item.useH2 !== result.useH2 &&
        !item.enableProxyRules !== result.enableProxyRules
      ) {
      dataHash = item.dataHash;
      base64Hash = item.base64Hash;
      composerHistory.splice(i, 1);
      break;
    }
  }
  result.dataHash = dataHash;
  result.base64Hash = base64Hash;
  composerHistory.unshift(result);
  var overflow = composerHistory.length - MAX_HISTORY_LEN;
  if (overflow > 0) {
    composerHistory.splice(MAX_HISTORY_LEN, overflow);
  }
  composerTimer = composerTimer || setTimeout(saveComposerHistory, 2000);
}

function parseHeaders(headers, rawHeaderNames, clientId) {
  var type = headers && typeof headers;
  if (type != 'string' && type !== 'object') {
    return {};
  }

  var reqHeaders = type === 'object' ? headers : common.parseRawJson(headers);
  if (reqHeaders) {
    reqHeaders = common.lowerCaseify(reqHeaders, rawHeaderNames);
  } else {
    reqHeaders = common.parseHeaders(headers, rawHeaderNames);
  }
  if (clientId && reqHeaders[config.CLIENT_ID_HEADER] !== clientId) {
    reqHeaders[config.COMPOSER_CLIENT_ID_HEADER] = clientId;
  }
  return reqHeaders;
}

function drain(socket) {
  socket.on('error', noop);
  socket.on('data', noop);
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
    common.connectInner({
      host: options.hostname,
      port: options.port || 443,
      proxyHost: PROXY_OPTS.host,
      proxyPort: PROXY_OPTS.port,
      headers: options.headers
    }, function(socket, svrRes, err) {
      if (err) {
        return execCb && execCb(err);
      }
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
      execCb && execCb(null, {
        statusCode: svrRes.statusCode,
        headers: svrRes.headers
      });
    }, config).on('error', execCb || noop);
  }
}

function getReqRaw(options) {
  var headers = options.headers;
  var statusLine = options.method +' ' + (options.path || '/') +' ' + 'HTTP/1.1';
  var raw = statusLine;
  if (headers = getRawHeaders(headers)) {
    raw += '\r\n' + headers;
  }
  return raw + '\r\n\r\n';
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
    common.connect(PROXY_OPTS, function(err, socket) {
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
                }, noop);
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
            headers: socket.headers || {}
          });
        }, true);
      }
    });
  }
}

function handleHttp(options, cb, count, reqId) {
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
    var client = http.request(options, function(svrRes) {
      if (!execCb) {
        return drain(svrRes);
      }
      svrRes.on('error', execCb);
      var buffer;
      var enableStream;
      var unzipStream = common.getUnzipStream(svrRes.headers);
      var timer = reqId && setTimeout(function() {
        composeData.setData(reqId, buffer, true);
        enableStream = true;
        timer = buffer = undefined;
        handleResponse();
        common.onResEnd(svrRes, function() {
          var buf = composeData.getData(reqId);
          if (buf) {
            buf._hasW2End = true;
          } else {
            composeData.removeData(reqId);
          }
        });
      }, 3000);
      var handleResponse = function() {
        if (buffer === null) {
          return;
        }
        timer && clearTimeout(timer);
        var headers = svrRes.headers;
        if (typeof headers.trailer === 'string' && headers.trailer.indexOf(',') !== -1) {
          headers.trailer = headers.trailer.split(',');
        }
        var result = {
          statusCode: svrRes.statusCode,
          headers: headers,
          trailers: svrRes.trailers,
          rawHeaderNames: getRawHeaderNames(svrRes.rawHeaders),
          rawTrailerNames: getRawHeaderNames(svrRes.rawTrailers),
          reqId: timer ? undefined : reqId
        };
        result.base64 = buffer && buffer.toString('base64');
        execCb(null, result);
        buffer = null;
      };
      if (unzipStream) {
        unzipStream.on('error', function(err) {
          drain(svrRes);
          execCb(err);
        });
        svrRes.pipe(unzipStream);
      } else {
        unzipStream = svrRes;
      }
      unzipStream.on('data', function(data) {
        if (enableStream) {
          if (!composeData.setData(reqId, data)) {
            enableStream = false;
            drain(svrRes);
            svrRes.unpipe(unzipStream);
          }
        } else if (buffer !== null) {
          buffer = buffer ? Buffer.concat([buffer, data]) : data;
          if (buffer.length > MAX_LENGTH) {
            handleResponse();
            if (unzipStream !== svrRes) {
              drain(svrRes);
              svrRes.unpipe(unzipStream);
            }
          }
        }
      });
      unzipStream.on('end', handleResponse);
    });
    client.on('error', execCb || noop);
    client.end(options.body);
    options.body = null;
  }
}

function getCharset(headers) {
  var charset = headers && headers['x-whistle-charset'];
  return charset || common.getCharset(headers['content-type']);
}

exports.handleRequest = function(req, res) {
  var fullUrl = req.body.url;
  if (!fullUrl || typeof fullUrl !== 'string') {
    return res.json({ec: 0});
  }

  fullUrl = common.encodeNonLatin1Char(fullUrl.replace(/#.*$/, ''));
  var options = common.parseUrl(common.setProtocol(fullUrl));
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
  var method = common.getMethod(req.body.method);
  var isWebSocket = method === 'WEBSOCKET';
  delete headers[config.WEBUI_HEAD];
  headers[config.REQ_FROM_HEADER] = 'W2COMPOSER';
  if (req.body.enableProxyRules === false) {
    headers[config.DISABLE_RULES_HEADER] = '1';
  }
  headers.host = options.host;
  options.clientId = clientId;
  headers[config.CLIENT_IP_HEAD] = req.headers[config.CLIENT_IP_HEAD] || '127.0.0.1';
  headers[config.CLIENT_PORT_HEAD] = common.getClientPort(req, config);
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
    delete headers.upgrade;
    if (!isConn && ((useH2 && (protocol === 'https:' || protocol === 'http:')) || protocol === 'h2:' || protocol === 'http2:')) {
      req.body.useH2 = true;
      var isHttp = protocol === 'http:';
      options.protocol = isHttp ? 'http:' : 'https:';
      if (!headers[config.ALPN_PROTOCOL_HEADER]) {
        headers[config.ALPN_PROTOCOL_HEADER] = (isHttp ? 'httpH2' : 'h2');
      }
    }
  }
  if (!req.body.noStore && req.body.needResponse && common.checkHistory(req.body)) {
    handleComposerHistory(req.body);
    dataCenter.saveData({
      type: 'composer',
      history: composerHistory
    });
  }

  var getBody = function(cb) {
    var base64 = req.body.base64;
    var body = base64 || req.body.body;
    if (!isWs) {
      delete headers.trailer;
    }
    if (isWs || isConn || common.hasRequestBody(options)) {
      body = body && common.toBuffer(body, base64 ? 'base64' : getCharset(headers));
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
      common.sendGzip(req, res, {ec: 0, em: 'success', res: data || ''});
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
      handleHttp(options, handleResponse, count, req.body.reqId);
    }
    if (!handleResponse) {
      res.json({ec: 0, em: 'success'});
    }
  });
};

exports.getHistory = function(req, res) {
  common.sendGzip(req, res, composerHistory);
};

exports.setup = function(conf) {
  config = conf;
  PROXY_OPTS = {
    host: config.host || '127.0.0.1',
    port: config.port
  };
  propertiesStorage = new Storage(config.propertiesDir, null, false,  { composerHistory: true });
  var history = propertiesStorage.readFile('composerHistory');
  try {
    composerHistory = JSON.parse(history);
  } catch (e) {}
  if (Array.isArray(composerHistory)) {
    composerHistory = composerHistory.filter(common.checkHistory);
    composerHistory = composerHistory.slice(0, MAX_HISTORY_LEN);
  } else {
    composerHistory = [];
  }
  dataCenter.saveComposeData(composerHistory);
};
