var tls = require('tls');
var Q = require('q');
var cert = require('./cert');
var MAX_SERVERS = 256;
var MAX_PORT = 60000;
var curPort = 50000;
var domain = require('domain');

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
	self._getServer({
		key: certs[0],
		cert: certs[1]
	}, secureConnectionListener, 
			defer.resolve.bind(defer), hostname);
	self._serverCount++;
	
	return self;
};

proto._getServer = function getServer(options, secureConnectionListener, callback, hostname) {
	var self = this;
	var cache = self._cache;
	
	if (curPort > MAX_PORT) {
		curPort = MIN_PORT = 40000;
	}
	var d = domain.create();
	function destroy() {
		self._destroy(hostname);
		d.dispose();
	}
	d.on('error', destroy)
		.on('close', destroy);
	
	
	d.run(function() {
		var server = tls.createServer(options, secureConnectionListener);
		server.on('error', function () {
			self._getServer(options, secureConnectionListener, callback, hostname);
		});
		
		var port = curPort++;
		server.listen(port, 'localhost', function() {
			callback(port);
		});
	});
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

proto._destroy = function _destroy(hostname) {
	var cache = this._cache;
	var server = cache[hostname];
	if (server) {
		delete cache[hostname];
		server.close();
	}
};

proto.destroy = function destroy() {
	var cache = this._cache;
	this._cache = {};
	for (var i in cache) {
		var server = cache[i];
		delete cache[i];
		server.close();
	}
};

module.exports = ServerAgent;

