var http = require('http');
var util = require('util');
var path = require('path');
var ca = require('../https/ca');
var Storage = require('../rules/storage');
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
	options.getRootCAFile = ca.getRootCAFile;
	options.createCertificate = ca.createCertificate;
	options.storage = new Storage(path.join(options.config.DATA_DIR, '.plugins', options.name));
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
	var port, uiPort, rulesPort, resRulesPort, statusPort, tunnelRulesPort, tunnelPort;
	var count = 0;
	var callbackHandler = function() {
		if (--count <= 0) {
			callback(null, {
				port: port,
				uiPort: uiPort,
				rulesPort: rulesPort,
				resRulesPort: resRulesPort,
				statusPort: statusPort,
				tunnelRulesPort: tunnelRulesPort,
				tunnelPort: tunnelPort
			});
		}
	};
	
	var startServer = execPlugin.pluginServer || execPlugin.server || execPlugin;
	if (typeof startServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startServer(server, options);
			port = _port;
			callbackHandler();
		});
	}
	
	var startUIServer = execPlugin.uiServer || execPlugin.innerServer || execPlugin.internalServer;
	if (typeof startUIServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startUIServer(server, options);
			uiPort = _port;
			callbackHandler();
		});
	}
	
	var startRulesServer = execPlugin.pluginRulesServer || execPlugin.rulesServer || execPlugin.reqRulesServer;
	if (typeof startRulesServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startRulesServer(server, options);
			rulesPort = _port;
			callbackHandler();
		});
	}
	
	var startResRulesServer = execPlugin.resRulesServer;
	if (typeof startResRulesServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startResRulesServer(server, options);
			resRulesPort = _port;
			callbackHandler();
		});
	}
	
	var startStatusServer = execPlugin.statusServer || execPlugin.stateServer;
	if (typeof startStatusServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startStatusServer(server, options);
			statusPort = _port;
			callbackHandler();
		});
	}
	
	var startTunnelRulesServer = execPlugin.pluginRulesServer || execPlugin.tunnelRulesServer;
	if (typeof startTunnelRulesServer == 'function') {
		++count;
		getServer(function(server, _port) {
			startTunnelRulesServer(server, options);
			tunnelRulesPort = _port;
			callbackHandler();
		});
	}
	
	var startTunnelServer = execPlugin.pluginServer || execPlugin.tunnelServer || execPlugin.connectServer;
  if (typeof startTunnelServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startTunnelServer(server, options);
      tunnelPort = _port;
      callbackHandler();
    });
  }
	
	if (!count) {
		callbackHandler();
	}
};

