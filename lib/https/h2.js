var https = require('https');
var http2 = require('../config').enableH2 ? require('http2') : null;

var H2_SETTINGS = { enablePush: false , enableConnectProtocol: false };

exports.getServer = function(options, listener) {
  var createServer;
  if (options.allowHTTP1 && http2) {
    createServer = http2.createSecureServer;
    options.setttings = H2_SETTINGS;
  } else {
    createServer = https.createServer;
  }
  var server = createServer(options);
  if (typeof listener === 'function') {
    server.on('request', listener);
  } else if (listener) {
    Object.keys(listener).forEach(function(name) {
      server.on(name, listener[name]);
    });
  }
  return server;
};
// TODO(v2): 处理HTTP2请求，包括直连和代理请求
exports.request = function(req, res, callback) {
  if (!req.useH2) {
    return callback();
  }
  callback();
};
