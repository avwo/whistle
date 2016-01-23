var assert = require('assert');
var qs = require('querystring');
var http = require('http');
var util = require('./cp-util');
var HEARTBEAT_INTERVAL = util.HEARTBEAT_INTERVAL;
var HEARTBEAT_TIMEOUT = util.HEARTBEAT_TIMEOUT;
var MESSAGE = util.MESSAGE;
var MAX_PORT = 65535;
var curPort = 60000;
var DELAY = 600;
var options = JSON.parse(decodeURIComponent(process.argv[2]));
var pluginPath = options.pluginPath;
var pluginQueryName = '?pluginValue=';
var pluginQueryIndex = pluginPath.indexOf(pluginQueryName);
var pluginValue;
if (pluginQueryIndex != -1) {
	pluginValue = pluginPath.substring(pluginQueryIndex + pluginQueryName.length);
	pluginPath = pluginPath.substring(0, pluginQueryIndex);
}

var execPlugin = require(options.pluginPath);
var timeout, heartbeatTimeout;

assert(typeof execPlugin == 'function', options.pluginPath + ' must export a function');

getServer(function(server, port) {
	execPlugin(server, pluginValue);
	process.send(JSON.stringify({
		type: 'port',
		port: port
	}));
});
heartbeat();
process.on('message', heartbeat);

function heartbeat() {
	clearTimeout(heartbeatTimeout);
	clearTimeout(timeout);
	timeout = setTimeout(function() {
		process.send(MESSAGE);
	}, HEARTBEAT_INTERVAL);
	heartbeatTimeout = setTimeout(handleError, HEARTBEAT_TIMEOUT);
}

function handleError() {
	process.exit(1);
}

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





