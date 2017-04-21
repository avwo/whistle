var tls = require('tls');
var Q = require('q');
var ca = require('./ca');
var getServer = require('../util/get-server').create(createTLSServer, 40600);

var MAX_SERVERS = 320;
var TIMEOUT = 6000;
// var DELAY = 100;

function createTLSServer(options, listener) {
  return tls.createServer(options, listener);
}

function ServerAgent() {
  this._cache = {};
  this._serverCount = 0;
}

var proto = ServerAgent.prototype;

proto.createServer = function createServer(hostname, listener, callback) {
  var self = this;
  var cache = self._cache;

  var promise = cache[hostname];
  var defer;

  if (!promise) {
    defer = Q.defer();
    cache[hostname] = promise = defer.promise;
  }

  promise.done(callback);

  if (!defer) {
    return ;
  }

  self.freeServer();
  getServer(ca.createCertificate(hostname), listener, function(server, port) {
    var removeServer = function() {
      self.removeServer(hostname);
    };
    server.on('error', removeServer);
    promise.server = server;
    var timeout = setTimeout(removeServer, TIMEOUT);
    server.once('secureConnection', function() {
      clearTimeout(timeout);
    });
    defer.resolve(port);
  });
  self._serverCount++;

  return self;
};

proto.removeServer = function removeServer(hostname) {
  var self = this;
  var cache = self._cache;
  var promise = cache[hostname];
  if (!promise) {
    return;
  }
  delete cache[hostname];
  --self._serverCount;
  setTimeout(function() {
    try {
      promise.server.close();
    } catch(e) {} //重复关闭会导致异常
  }, TIMEOUT);
};

proto.freeServer = function() {
  var self = this;
  if (self._serverCount < MAX_SERVERS) {
    return;
  }

  var cache = self._cache;
  for (var i in cache) {
    destroy(i);
  }

  function destroy(hostname) {
    var promise = cache[hostname];
    if (promise._pending) {
      return;
    }
    promise._pending = true;
    promise.done(function(port) {
      var server = promise.server;
      server.getConnections(function(err, count) {
        promise._pending = false;
        if (!err && !count && self._serverCount > MAX_SERVERS) {
          delete cache[hostname];
          --self._serverCount;
          try {
            server.close();
          } catch(e) {} //重复关闭会导致异常
        }
      });
    });
  }
};

//proto.destroy = function destroy() {
//  var cache = this._cache;
//  this._cache = {};
//  this._serverCount = 0;
//  for (var i in cache) {
//    var promise = cache[i];
//    promise.done(function() {
//      setTimeout(function() {
//        try {
//          promise.server.close();
//        } catch(e) {} //重复关闭会导致异常
//      }, DELAY);
//    });
//  }
//};

module.exports = ServerAgent;


