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
  options.method = getMethod(req.body.method);

  options.protocol = null;
  options.hostname = null;
  options.host = '127.0.0.1';
  options.port = config.port;
  if (headers['content-length'] != null) {
    req.body.body = util.toBuffer(req.body.body || '');
    headers['content-length'] = req.body.body.length;
  }

  headers[config.CLIENT_IP_HEAD] = util.getClientIp(req);
  options.headers = util.formatHeaders(headers, rawHeaderNames);
  http.request(options, function(res) {
    res.on('error', util.noop);
    util.drain(res);
  }).on('error', util.noop).end(req.body.body);
  res.json({ec: 0, em: 'success'});
};
