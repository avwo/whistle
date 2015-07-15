var tls = require('tls');
var Q = require('q');
var cert = require('./cert');
var MAX_SERVERS = 256;
var MAX_PORT = 60000;
var curPort = 50000;

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
	
	var certs = cert.getCert(hostname);
	self.freeServer();
	getServer({
		key: certs[0],
		cert: certs[1]
	}, secureConnectionListener, 
			function(port, server) {
		server.on('error', function() {
			if (cache[hostname]) {
				tls.createServer(options, secureConnectionListener)
				.on('error', noop);
			}
		});
		promise.server = server;
		defer.resolve(port);
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
		promise.done(function(port) {
			var server = promise.server;
			if (!server.getConnections() && self._serverCount > MAX_SERVERS) {
				delete cache[hostname];
				--self._serverCount;
				server.close();
			}
		});
	}
};

proto.destroy = function destroy() {
	var cache = this._cache;
	this._cache = {};
	this._serverCount = 0;
	for (var i in cache) {
		var promise = cache[i];
		delete cache[i];
		promise.done(function(port) {
			promise.server.close();
		});
	}
};

function getServer(options, secureConnectionListener, callback) {
	var self = this;
	
	if (curPort > MAX_PORT) {
		curPort = MIN_PORT = 40000;
	}
	
	var server = tls.createServer(options, secureConnectionListener);
	var next = function() {
		getServer(options, secureConnectionListener, callback);
	};
	server.on('error', next);
	
	var port = curPort++;
	server.listen(port, 'localhost', function() {
		server.removeListener('error', next);
		callback(port, server);
	});
}

function noop() {}

module.exports = ServerAgent;

