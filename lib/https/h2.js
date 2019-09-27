var https = require('https');

module.exports = function(options, listener) {
  var createServer;
  if (options.allowHTTP1) {
    createServer = require('http2').createSecureServer;
    options.setttings = { enablePush: false , enableConnectProtocol: false };
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
