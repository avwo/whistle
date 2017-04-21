var http = require('http');

var MIN_PORT = 40000;
var MAX_PORT = 65000;
var createHttpServer = function() {
  return http.createServer();
};

function create(createServer, minPort, maxPort) {
  minPort = minPort || MIN_PORT;
  maxPort = maxPort || MAX_PORT;
  createServer = createServer || createHttpServer;
  var curPort = minPort;

  return function getServer() {
    var args = Array.prototype.slice.apply(arguments);
    curPort++;
    if (curPort > MAX_PORT) {
      curPort = Math.min(minPort - 10000, 30000);
    }
    if (curPort % 10 === 0) {
      curPort++;
    }

    var server = createServer.apply(null, args);
    var port = curPort;
    var next = function() {
      setImmediate(function() {
        getServer.apply(null, args);
      });
    };
    server.on('error', next);
    server.listen(port, function() {
      server.removeListener('error', next);
      args[args.length - 1](server, port);
    });
  };
}

module.exports = function(callback, defaultPort, minPort) {
  var _getServer = create(null, minPort);
  var getServer = function() {
    _getServer(callback);
  };
  if (defaultPort > 0) {
    var server = createHttpServer();
    server.on('error', getServer);
    server.listen(defaultPort, function() {
      callback(server, defaultPort);
    });
  } else {
    getServer();
  }
};
module.exports.create = create;
