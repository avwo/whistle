var https = require('https');
var enableH2 = require('../config').enableH2;
var createServer = enableH2 ? require('http2').createSecureServer : https.createServer;

module.exports = function(options, listener) {
  if (enableH2) {
    options.allowHTTP1 = true;
    options.setttings = { enablePush: false , enableConnectProtocol: false };
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
