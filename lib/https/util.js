var hagent = require('hagent');
var tls = require('tls');
var ca = require('./ca');

var createTLSServer = function(options, listener) {
  return tls.createServer(options, listener);
};
var getTLSServer = hagent.create(createTLSServer, 41500);
var callbacks = [];
var TIMEOUT = 3000;
var sniPort;

var SNICallback = function(serverName, cb) {
  serverName = ca.getDomain(serverName);
  cb(null, ca.createCertificate(serverName));
};

exports.getSNIServer = function(listener, callback) {
  if (sniPort) {
    return callback(sniPort);
  }
  getTLSServer({ SNICallback: SNICallback }, listener, function(server, port) {
    var removeServer = function() {
      sniPort = null;
      try {
        server.close();
      } catch(e) {} //重复关闭会导致异常
    };
    server.on('error', removeServer);
    var timeout = setTimeout(removeServer, TIMEOUT);
    server.once('secureConnection', function() {
      clearTimeout(timeout);
    });
    sniPort = port;
    callbacks.forEach(function(cb) {
      cb(sniPort);
    });
  });
};

exports.getDomain = ca.getDomain;
exports.existsCustomCert = ca.existsCustomCert;
exports.getRootCAFile = ca.getRootCAFile;
