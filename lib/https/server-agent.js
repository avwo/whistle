var tls = require('tls');
var Q = require('q');
var ca = require('./ca');
var MAX_SERVERS = 256;
var MAX_PORT = 60000;
var curPort = 50000;
var DELAY = 600;

function ServerAgent() {
	this._cache = {};
	this._serverCount = 0;
}

var proto = ServerAgent.prototype;

proto.createServer = function createServer(hostname, secureConnectionListener, callback) {
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
	getServer(ca.createCertificate(hostname), secureConnectionListener, 
			function(port, server) {
		server.on('error', function() {
			if (cache[hostname]) {
				tls.createServer(options, secureConnectionListener)
				.on('error', noop);
			}
		});
		
		setTimeout(function() {
			promise.server = server;
			defer.resolve(port);
		}, DELAY);
	});
	self._serverCount++;
	
	return self;
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
		if (primise._pending) {
			return;
		}
		primise._pending = true;
		promise.done(function(port) {
			var server = promise.server;
			server.getConnections(function(err, count) {
				primise._pending = false;
				if (!err && !count && self._serverCount > MAX_SERVERS) {
					delete cache[hostname];
					--self._serverCount;
					setTimeout(function() {
						try {
							server.close();
						} catch(e) {} //重复关闭会导致异常
					}, DELAY);
				}
			});
		});
	}
};

proto.destroy = function destroy() {
	var cache = this._cache;
	this._cache = {};
	this._serverCount = 0;
	for (var i in cache) {
		var promise = cache[i];
		if (primise._pending) {
			return;
		}
		primise._pending = true;
		promise.done(function(port) {
			delete cache[hostname];
			primise._pending = false;
			setTimeout(function() {
				try {
					promise.server.close();
				} catch(e) {} //重复关闭会导致异常
			}, DELAY);
		});
	}
};

function getServer(options, secureConnectionListener, callback) {
	var self = this;
	
	if (curPort > MAX_PORT) {
		curPort = 40000;
	}
	
	var server = tls.createServer(options, secureConnectionListener);
	var next = function() {
		getServer(options, secureConnectionListener, callback);
	};
	server.on('error', next);
	
	var port = curPort++;
	server.listen(port, function() {
		server.removeListener('error', next);
		callback(port, server);
	});
}

function noop() {}

module.exports = ServerAgent;

