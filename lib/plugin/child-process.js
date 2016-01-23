var cp = require('child_process');
var assert = require('assert');
var path = require('path');
var Q = require('q');
var util = require('./cp-util');
var HEARTBEAT_INTERVAL = util.HEARTBEAT_INTERVAL;
var HEARTBEAT_TIMEOUT = util.HEARTBEAT_TIMEOUT;
var MESSAGE = util.MESSAGE;
var MAIN = path.join(__dirname, 'cp-main');
var cache = {};

function fork(options, callback) {
	var pluginPath = options && options.pluginPath;
	if (typeof pluginPath != 'string' || !(pluginPath = pluginPath.trim())) {
		return;
	}
	
	if (options.pluginValue) {
		pluginPath = pluginPath + '?pluginValue=' + options.pluginValue;
	}
	var promise = cache[pluginPath];
	var defer;
	
	if (!promise) {
		defer = Q.defer();
		cache[pluginPath] = promise = defer.promise;
	}
	
	promise.done(function(ports) {
		callback(null, ports);
	}, function(err) {
		callback(err);
	});
	
	if (!defer) {
		return;
	} 
	
	var timeout, heartbeatTimeout, done;
	var child = cp.spawn('node', [MAIN, JSON.stringify(options)], {
		detached: true,
		stdio: ['ipc']
	});
	
	child.on('error', handleError);
	child.on('close', handleError);
	child.on('exit', handleError);
	child.on('disconnect', handleError);
	child.on('message', function(msg) {
		 heartbeat();
		if (msg == MESSAGE) {
			return;
		}
		
		try {
			msg = JSON.parse(msg);
			if (msg.type == 'port') {
				handleCallback(null, msg.port);
			}
		} catch(e) {}
	});
	child.stderr.on('data', function(err) {
		if (done) {
			return;
		}
		err = err + '';
		killChild();
		handleCallback(err);
	});
	child.unref();
	heartbeat();
	
	function heartbeat() {
		clearAllTimeout();
		timeout = setTimeout(function() {
			child.send(MESSAGE);
		}, HEARTBEAT_INTERVAL);
		heartbeatTimeout = setTimeout(handleError, HEARTBEAT_TIMEOUT);
	}
	
	function clearAllTimeout() {
		clearTimeout(heartbeatTimeout);
		clearTimeout(timeout);
	}
	
	function handleError(err) {
		killChild();
		process.nextTick(function() {
			handleCallback(err && err.stack || 'Error');
		});
	}
	
	function killChild() {
		clearAllTimeout();
		delete cache[pluginPath];
		try {
			process.kill(child.pid);
		} catch(e) {}
	}

	function handleCallback(err, port) {
		if (done) {
			return;
		}
		done = true;
		if (err) {
			defer.reject(err);
		} else {
			defer.resolve(port);
		}
	}
}

exports.fork = fork;

