var http = require('http');
var net = require('net');
var url = require('url');
var config = require('../lib/config');
var util = require('../lib/util');

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

function isConnect(options) {
  if (options.method === 'CONNECT') {
    return true;
  }
  var p = options.protocol;
  return p === 'connect:' || p === 'socket:' || p === 'tunnel:';
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
  }, drain).on('error', util.noop);
}

function getReqRaw(options) {
  var headers = options.headers;
  var raw = [options.method +' ' + (options.path || '/') +' ' + 'HTTP/1.1'];
  Object.keys(headers).forEach(function(key) {
    var value = headers[key];
    if (Array.isArray(value)) {
      value.forEach(function(val) {
        raw.push(key + ': ' +  (val || ''));
      });
    } else {
      raw.push(key + ': ' +  (value || ''));
    }
  });
  return raw.join('\r\n') + '\r\n\r\n';
}

function handleWebSocket(options) {
  if (options.protocol === 'https:' || options.protocol === 'wss:') {
    options.headers[config.HTTPS_FIELD] = 1;
  }
  var socket = net.connect(config.port, function() {
    socket.write(getReqRaw(options));
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
    util.drain(res);
  }).on('error', util.noop).end(options.body);
}

module.exports = function(req, res) {
  var fullUrl = req.body.url;
  if (!fullUrl || typeof fullUrl !== 'string') {
    return res.json({ec: 0});
  }

  fullUrl = util.encodeNonAsciiChar(fullUrl.replace(/#.*$/, ''));
  var options = url.parse(util.setProtocol(fullUrl));
  if (!options.host) {
    return res.json({ec: 0});
  }

  var rawHeaderNames = {};
  var headers = parseHeaders(req.body.headers, rawHeaderNames);
  if (!headers['user-agent']) {
    headers['user-agent'] = 'whistle/' + config.version;
  }
  headers.host = options.host;
  headers[config.CLIENT_IP_HEAD] = util.getClientIp(req);
  options.method = getMethod(req.body.method);

  if (headers['content-length'] != null) {
    req.body.body = util.toBuffer(req.body.body || '');
    headers['content-length'] = req.body.body.length;
  }

  var isWs = isWebSocket(options)
    || (/upgrade/i.test(headers.connection) && /websocket/i.test(headers.upgrade));
  if (isWs) {
    headers.connection = 'Upgrade';
    headers.upgrade = 'websocket';
  } else {
    headers.connection = 'close';
    delete headers.upgrade;
  }
  options.headers = util.formatHeaders(headers, rawHeaderNames);
  options.body = req.body.body;
  if (isWs) {
    handleWebSocket(options);
  } else if (isConnect(options)) {
    handleConnect(options);
  } else  {
    handleHttp(options);
  }

  res.json({ec: 0, em: 'success'});
};
