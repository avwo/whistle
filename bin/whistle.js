#! /usr/bin/env node

var program = require('../../starting');
var path = require('path');
var config = require('../lib/config');
var util = require('../lib/util');
var colors = require('colors/safe');

function error(msg) {
	console.log(colors.red(msg));
}

function warn(msg) {
	console.log(colors.yellow(msg));
}

function info(msg) {
	console.log(colors.cyan(msg));
}

function showUsage(isRunning) {
	if (isRunning) {
		warn('[!] ' + config.name + ' is running');
	} else {
		info('[!] ' + config.name + ' started');
	}
	info('[i] visit http://' + config.localUIHost + '/ to get started');
}

function showStartupInfo(err, options) {
	if (!err || err === true) {
		return showUsage(err);
	}
	options.port = options.port || config.port;
	if (/listen EADDRINUSE :::(\d+)/.test(err) && RegExp.$1 == options.port) {
		error('[!] Failed to bind proxy port ' + options.port + ': The port is already in use');
		info('[i] Please check if ' + config.name + ' is already running or if another application is using the port');
		info('[i] Or if another application is using the port, you can change the port with `w2 start -p newPort`');
	} else if (err.code == 'EACCES' || err.code == 'EPERM') {
		warn('[!] Cannot start ' + config.name + ' owned by root');
		info('[i] Try to run command with `sudo`')
	}
	
	console.log('\n');
	error(err.stack || err);
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
			info('[i] %s killed.', config.name);
		} else if (err) {
				if (err.code === 'EPERM') {
					warn('[!] Cannot kill ' + config.name + ' owned by root');
					info('[i] Try to run command with `sudo`');
				} else {
					error('[!] ' + err.message);
				}
		} else {
			warn('[!] No running ' + config.name);
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
