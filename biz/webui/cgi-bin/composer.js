var http = require('http');
var net = require('net');
var config = require('../lib/config');
var util = require('../lib/util');
var getSender = require('ws-parser').getSender;
var hparser = require('hparser');

var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;

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

function getMethod(method) {
  if (typeof method !== 'string') {
    return 'GET';
  }
  return method.toUpperCase();
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

function handleConnect(options) {
  options.headers['x-whistle-policy'] = 'tunnel';
  config.connect({
    host: options.hostname,
    port: options.port,
    proxyHost: '127.0.0.1',
    proxyPort: config.port,
    headers: options.headers
  }, function(socket) {
    drain(socket);
    var data = util.toBuffer(options.body, getCharset(options.headers));
    if (data && data.length) {
      socket.write(data);
    }
  }).on('error', util.noop);
}

function getReqRaw(options) {
  var headers = options.headers;
  var statusLine = options.method +' ' + (options.path || '/') +' ' + 'HTTP/1.1';
  var raw = [statusLine, getRawHeaders(headers)];
  return raw.join('\r\n') + '\r\n\r\n';
}

function handleWebSocket(options) {
  if (options.protocol === 'https:' || options.protocol === 'wss:') {
    options.headers[config.HTTPS_FIELD] = 1;
  }
  var binary = !!options.headers['x-whistle-frame-binary'];
  delete options.headers['x-whistle-frame-binary'];
  var socket = net.connect(config.port, '127.0.0.1', function() {
    socket.write(getReqRaw(options));
    var handleResponse = function(resData) {
      resData = resData + '';
      var index = resData.indexOf('\r\n\r\n') !== -1;
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
      } else {
        resData = resData.slice(-3);
      }
    };
    socket.on('data', handleResponse);
  });
  drain(socket);
}

function handleHttp(options) {
  if (options.protocol === 'https:') {
    options.headers[config.HTTPS_FIELD] = 1;
  }
  options.protocol = null;
  options.hostname = null;
  options.host = '127.0.0.1';
  options.port = config.port;
  http.request(options, function(res) {
    res.on('error', util.noop);
    drain(res);
  }).on('error', util.noop).end(options.body);
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

  fullUrl = util.encodeNonAsciiChar(fullUrl.replace(/#.*$/, ''));
  var options = util.parseUrl(util.setProtocol(fullUrl));
  if (!options.host) {
    return res.json({ec: 0});
  }

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
  options.method = getMethod(req.body.method);

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
        headers['content-length'] = body ? body.length : 0;
      }
    }
  } else {
    delete headers['content-length'];
  }
  delete headers['content-encoding'];
  options.headers = formatHeaders(headers, rawHeaderNames);

  if (isWs) {
    options.method = 'GET';
    handleWebSocket(options);
  } else if (isConn) {
    handleConnect(options);
  } else  {
    handleHttp(options);
  }

  res.json({ec: 0, em: 'success'});
};
