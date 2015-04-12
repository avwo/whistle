var path = require('path');
var program = require('commander');
var config = require('../util').config;

/**
 * Prepare the environment before run main program.
 * @param callback {Function}
 */
var bootstrap = function (callback) {
		// Make new created files writable by group members.
		if (process.setgid && process.getgid) {
			process.umask('002');
			process.setgid(parseInt(
				process.env['SUDO_GID'] || process.getgid(), 10));
		}

		callback();
	};

if (module.parent) { // Use as a sub module.
	module.exports = bootstrap;
} else { // Use as a main module.
	bootstrap(function () {
		program
			.version(config.version)
			.usage('<command> [options]');
		program
			.command('run <path>')
			.description('Start a front service')
			.action(function (path) {
				require(path)(program);
			});
	
		program
			.option('-f, --hosts [host]', 'hosts file', '')
			.option('-p, --port [port]', config.name + ' port(' + config.port + ' by default)', '')
			.option('-m, --plugins [plugins]', 'express middlewares(plugins) path (as: xx.js,yy/zz.js)', '')
			.option('-d, --uiport [uiport]', 'web ui http port(' + config.uiport + ' by default)', '')
			.option('-s, --uisslport [uisslport]', 'web ui https port(' + config.uisslport + ' by default)', '')
			.option('-a, --tianmaport [uisslport]', 'tianma http port(' + config.tianmaport + ' by default)', '')
			.option('-A, --tianmasslport [uisslport]', 'tianma https port(' + config.tianmasslport + ' by default)', '')
			.option('-u, --uipath [uipath]', 'web ui plugin path', '')
			.option('-t, --timneout [timneout]', 'request timeout(' + config.timeout + ' ms by default)', parseInt)
			.parse(process.argv);
			
		});
}
