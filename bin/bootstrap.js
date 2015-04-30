var path = require('path');
var program = require('commander');
var config = require('../util').config;

/**
 * Prepare the environment before run main program.
 * @param callback {Function}
 */
function bootstrap(callback) {
	// Make new created files writable by group members.
	if (process.setgid && process.getgid) {
		process.umask('002');
		process.setgid(parseInt(
			process.env['SUDO_GID'] || process.getgid(), 10));
	}

	callback();
}

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
	
		require('./util').setOptions(program)
		.parse(process.argv);
			
	});
}
