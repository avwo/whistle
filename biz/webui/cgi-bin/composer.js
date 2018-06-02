var http = require('http');
var net = require('net');
var config = require('../lib/config');
var util = require('../lib/util');
var getSender = require('ws-parser').getSender;
var events = require('../lib/events');
var hparser = require('hparser');

var formatHeaders = hparser.formatHeaders;
var getRawHeaders = hparser.getRawHeaders;

function parseHeaders(headers, rawHeaderNames) {
  if (!headers || typeof headers != 'string') {
    return {};
  }

  try {
    return util.lowerCaseify(JSON.parse(headers), rawHeaderNames);
  } catch(e) {}

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
  var id = util.getReqId();
  options.headers['x-whistle-composer-id'] = id;
  config.connect({
    host: options.hostname,
    port: options.port,
    proxyHost: '127.0.0.1',
    proxyPort: config.port,
    headers: options.headers
  }, function(socket) {
    drain(socket);
    if (options.body) {
      socket.write(options.body);
    }
    var sendData = function(data, isBinary) {
      data = util.toBuffer(data);
      if (!data || !data.length) {
        return;
      }
      socket.write(data);
    };
    id = 'composer-' + id;
    sendData(options.body);
    events.on(id, sendData);
    util.onSocketEnd(socket, function() {
      events.removeListener(id, sendData);
    });
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
  var id = util.getReqId();
  options.headers['x-whistle-composer-id'] = id;
  var socket = net.connect(config.port, '127.0.0.1', function() {
    socket.write(getReqRaw(options));
    var str;
    var handleResponse = function(data) {
      str = data + '';
      var index = str.indexOf('\r\n\r\n') !== -1;
      if (index !== -1) {
        socket.removeListener('data', handleResponse);
        socket.headers = parseHeaders(str.slice(0, index));
        var sender = getSender(socket);
        var sendData = function(data, isBinary) {
          data = util.toBuffer(data);
          if (!data || !data.length) {
            return;
          }
          sender.send(data, {
            mask: true,
            binary: isBinary
          }, util.noop);
        };
        id = 'composer-' + id;
        sendData(options.body, binary);
        events.on(id, sendData);
        var clearup = function() {
          events.removeListener(id, sendData);
        };
        socket.on('error', clearup);
        socket.on('close', clearup);
      } else {
        str = str.slice(-3);
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

  var body = req.body.body;
  if (body && (isWs || isConn || util.hasRequestBody(options))) {
    body = options.body = util.toBuffer(body);
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
  options.headers = formatHeaders(headers, rawHeaderNames);

  if (isWs) {
    handleWebSocket(options);
  } else if (isConn) {
    handleConnect(options);
  } else  {
    handleHttp(options);
  }

  res.json({ec: 0, em: 'success'});
};
