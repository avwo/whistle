#! /usr/bin/env node

var program = require('starting');
var path = require('path');
var os = require('os');
var config = require('../lib/config');
var util = require('../lib/util');
var colors = require('colors/safe');

function getIpList() {
	var ipList = [];
	var ifaces = os.networkInterfaces();
	Object.keys(ifaces).forEach(function(ifname) {
		 ifaces[ifname].forEach(function (iface) {
			    if (iface.family == 'IPv4') {
			    	ipList.push(iface.address);
			    }
			  });
	});
	
	return ipList;
}

function error(msg) {
	console.log(colors.red(msg));
}

function warn(msg) {
	console.log(colors.yellow(msg));
}

function info(msg) {
	console.log(colors.green(msg));
}

function showUsage(isRunning, options) {
	var port = options.port || config.port;
	if (isRunning) {
		warn('[!] ' + config.name + ' is running');
	} else {
		info('[i] ' + config.name + ' started');
	}
	
	info('[i] First, use your device to visit the following URL list, gets the ' + colors.bold('IP') + ' of the URL you can visit:');
	info(getIpList().map(function(ip) {
		return '    http://' + colors.bold(ip) + (port ? ':' + port : '') + '/';
	}).join('\n'));
	
	warn('    Note: If the following URLs are unable to access, check the server\'s firewall settings');
	warn('          For more information, please visit ' + colors.bold('https://github.com/avwo/whistle'));
	info('[i] Second, configure your device to use ' + config.name + ' as its HTTP and HTTPS proxy on ' + colors.bold('IP:') + port);
	info('[i] Last, use ' + colors.bold('Chrome') + ' to visit ' + colors.bold('http://' + config.localUIHost + '/') + ' to get started');
}

function showStartupInfo(err, options) {
	if (!err || err === true) {
		return showUsage(err, options);
	}
	options.port = options.port || config.port;
	if (/listen EADDRINUSE :::(\d+)/.test(err) && RegExp.$1 == options.port) {
		error('[!] Failed to bind proxy port ' + options.port + ': The port is already in use');
		info('[i] Please check if ' + config.name + ' is already running or if another application is using the port, you can restart whistle with `w2 restart`');
		info('[i] Or if another application is using the port, you can change the port with `w2 start -p newPort`');
	} else if (err.code == 'EACCES' || err.code == 'EPERM') {
		error('[!] Cannot start ' + config.name + ' owned by root');
		info('[i] Try to run command with `sudo`')
	}
	
	console.log('\n');
	error(err.stack ? 'Date: ' + util.formatDate() + '\n' + err.stack : err);
}

program.setConfig({
	main: path.join(__dirname, '../index.js'),
	name: config.name,
	version: config.version,
	runCallback: function(options) {
		console.log('Press [Ctrl+C] to stop ' + config.name + '...\n');
		showUsage(false, options);
	},
	startCallback: showStartupInfo,
	restartCallback: showStartupInfo,
	stopCallback: function(err) {
		if (err === true) {
			info('[i] %s killed.', config.name);
		} else if (err) {
				if (err.code === 'EPERM') {
					error('[!] Cannot kill ' + config.name + ' owned by root');
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
