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
	assert(typeof execPlugin == 'function', options.value + ' must export a function');
	var execUIServer = execPlugin.uiServer;
	getServer(function(server, port) {
		execPlugin(server, options);
		callback(port);
	});
	if (typeof execUIServer == 'function') {
		getServer(function(server, port) {
			execUIServer(server, options);
			callback(port);
		});
	}
};

