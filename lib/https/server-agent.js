var tls = require('tls');
var Q = require('q');
var cert = require('./cert');
var MAX_SERVERS = 256;
var MAX_PORT = 60000;
var curPort = 50000;

function getServer(options, secureConnectionListener, callback) {
	if (curPort > MAX_PORT) {
		curPort = MIN_PORT = 40000;
	}
	
	var port = curPort++;
	var server = tls.createServer(options, secureConnectionListener);
	server.on('error', function() {
		port = 0;
		getServer(options, callback);
	});
	server.listen(port, 'localhost', function() {
		port && callback(port);
	});
}

function ServerAgent() {
	this._cache = {};
	this._serverCount = 0;
}

var proto = ServerAgent.prototype;

proto.createServer = function createServer(hostname, secureConnectionListener, callback) {
	var self = this;
	
	var promise = self._cache[hostname];
	var defer;
	
	if (!promise) {
		defer = Q.defer();
		self._cache[hostname] = promise = defer.promise;
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
			defer.resolve.bind(defer));
	self._serverCount++;
	
	return self;
};


proto.freeServer = function() {
	if (this._serverCount < MAX_SERVERS) {
		return;
	}
	
	var cache = this._cache;
	for (var i in cache) {
		var server = cache[i];
		if (!server.connections) {
			delete cache[i];
			server.close();
			if (--this._serverCount < MAX_SERVERS) {
				return;
			}
		}
	}
};

proto.destroy = function destroy() {
	var cache = this._cache;
	for (var i in cache) {
		var server = cache[i];
		delete cache[i];
		server.close();
	}
};

module.exports = ServerAgent;

