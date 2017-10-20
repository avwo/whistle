var http = require('http');
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
  var protocol = options.protocol;
  if (protocol === 'ws:' || protocol === 'wss:') {
    return true;
  }
  // TODO: 判断headers
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

function handleWebSocket(options) {

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
  options.headers = util.formatHeaders(headers, rawHeaderNames);
  options.body = req.body.body;
  if (isConnect(options)) {
    handleConnect(options);
  } else if (isWebSocket(options)) {
    handleWebSocket(options);
  } else {
    handleHttp(options);
  }

  res.json({ec: 0, em: 'success'});
};
