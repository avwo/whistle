var assert = require('assert');
var http = require('http');
var MAX_PORT = 65535;
var curPort = 60000;

function getServer(callback) {
	if (curPort > MAX_PORT) {
		curPort = 40000;
	}
	
	var server = http.createServer();
	var port = curPort++;
	var next = function() {
		getServer(callback);
	};
	server.on('error', next);
	server.listen(port, function() {
		server.removeListener('error', next);
		callback(server, port);
	});
}

module.exports = function(options, callback) {
	var execPlugin = require(options.value);
	assert(typeof execPlugin == 'function', options.value + ' is not a function');
	var startUIServer = execPlugin.uiServer;
	var port, uiPort;
	var count = 1;
	var callbackHandler = function() {
		if (--count <= 0) {
			callback(null, {
				port: port,
				uiPort: uiPort
			});
		}
	};
	
	getServer(function(server, _port) {
		execPlugin(server, options);
		port = _port;
		callbackHandler();
	});
	
	if (typeof startUIServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startUIServer(server, options);
			uiPort = _port;
			callbackHandler();
		});
	}
};

