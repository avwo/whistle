#! /usr/bin/env node

var program = require('../../starting');
var path = require('path');
var config = require('../lib/config');
var util = require('../lib/util');

function showUsage() {
	console.log('[!] ' + config.name + ( err ? ' is running.' : ' started.'));
	console.log('[i] visit http://' + config.localUIHost + '/ to get started');
}

function showStartupInfo(err, options) {
	if (!err || err === true) {
		return showUsage();
	}
	options.port = options.port || config.port;
	if (/listen EADDRINUSE :::(\d+)/.test(err) && RegExp.$1 == options.port) {
		console.log('Failed to bind proxy port %s: The port is already in use', options.port);
		console.log('Please check if %s is already running or if another application is using the port', config.name);
		console.log('Or if another application is using the port, you can change the port with `w2 start -p newPort`');
	} else if (err.code == 'EACCES' || err.code == 'EPERM') {
		console.log('[!] Cannot start %s owned by root.', config.name);
		console.log('[i] Try to run command with `sudo`.')
	}
	
	console.log('\n');
	console.log(err.stack || err);
}

program.setConfig({
	main: path.join(__dirname, '../index.js'),
	name: config.name,
	version: config.version,
	runCallback: showUsage,
	startCallback: showStartupInfo,
	restartCallback: showStartupInfo,
	stopCallback: function(err) {
		if (err === true) {
			console.log('[i] %s killed.', config.name);
		} else if (err) {
				err.code === 'EPERM' ? console.log('[!] Cannot kill %s owned by root.\n' +
					'[i] Try to run command with `sudo`.', config.name)
				: console.log('[!] %s', err.message);
		} else {
			console.log('[!] No running %s.', config.name);
		}
	}
});

program
	.option('-d, --debug', 'debug mode')
	.option('-n, --username [username]', 'login username', String, undefined)
	.option('-w, --password [password]', 'login password', String, undefined)
	.option('-p, --port [port]', config.name + ' port(' + config.port + ' by default)', parseInt, undefined)
	.option('-m, --middlewares [script path or module name]', 'express middlewares path (as: xx,yy/zz.js)', String, undefined)
	.option('-u, --uipath [script path]', 'web ui plugin path', String, undefined)
	.option('-t, --timneout [ms]', 'request timeout(' + config.timeout + ' ms by default)', parseInt, undefined)
	.option('-s, --sockets [number]', 'max sockets', parseInt, undefined)
	.parse(process.argv);
