var assert = require('assert');
var http = require('http');
var util = require('util');
var MAX_PORT = 60000;
var curPort = 45000;

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
	if (options.debugMode) {
		var cacheLogs = [];
		console.log = function() {
			var msg = util.format.apply(this, arguments);
			if (cacheLogs) {
				cacheLogs.push(msg);
			} else {
				process.sendData({
					type: 'console.log',
					message: msg
				});
			}
		};
		process.on('data', function(data) {
			if (cacheLogs && data && data.type == 'console.log' && data.status == 'ready') {
				var _cacheLogs = cacheLogs;
				cacheLogs = null;
				_cacheLogs.forEach(function(msg) {
					process.sendData({
						type: 'console.log',
						message: msg
					});
				});
			}
		});
	}
	
	var execPlugin = require(options.value);
	assert(typeof execPlugin == 'function', options.value + ' is not a function');
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
	
	var startUIServer = execPlugin.uiServer || execPlugin.innerServer || execPlugin.internalServer;
	if (typeof startUIServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startUIServer(server, options);
			uiPort = _port;
			callbackHandler();
		});
	}
};

