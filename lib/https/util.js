var hagent = require('hagent');
var https = require('https');
var ca = require('./ca');

var serverAgent = hagent.serverAgent;
serverAgent.createCertificate = ca.createCertificate;
exports.serverAgent = serverAgent;

var createHttpsServer = function(options, listener) {
  var server = https.createServer(options);
  if (typeof listener === 'function') {
    server.on('request', listener);
  } else if (listener) {
    Object.keys(listener).forEach(function(name) {
      server.on(name, listener[name]);
    });
  }
  return server;
};
var getTLSServer = hagent.create(createHttpsServer, 43900);
var callbacks = [];
var TIMEOUT = 6000;
var sniPort;

var SNICallback = function(serverName, cb) {
  serverName = ca.getDomain(serverName);
  var options = ca.createCertificate(serverName);
  if (!options._ctx) {
    options._ctx = ca.createSecureContext(options);
  }
  cb(null, options._ctx);
};

var removeServer = function() {
  sniPort = null;
  try {
    this.close();
  } catch(e) {} //重复关闭会导致异常
};

exports.getSNIServer = function(listener, callback) {
  if (sniPort) {
    return callback(sniPort);
  }
  getTLSServer({ SNICallback: SNICallback }, listener, function(server, port) {
    server.on('error', removeServer);
    var timeout = setTimeout(removeServer, TIMEOUT);
    var clearup = function() {
      clearTimeout(timeout);
    };
    server.once('tlsClientError', clearup);
    server.once('secureConnection', clearup);
    sniPort = port;
    callbacks.forEach(function(cb) {
      cb(sniPort);
    });
  });
};

exports.getDomain = ca.getDomain;
exports.existsCustomCert = ca.existsCustomCert;
exports.getRootCAFile = ca.getRootCAFile;
