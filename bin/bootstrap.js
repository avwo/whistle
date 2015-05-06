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
				for (var i in require('./util').argv) {
					config[i] = program[i] || config[i];
				} 
				
				if (config.plugins) {
					config.plugins = config.plugins.split(',');
				}
				
				if (Array.isArray(config.ports)) {
					var port = config.port;
					config.ports.forEach(function(name) {
						config[name] = ++port;
					});
				}
				require(path)(config);
			});
	
		require('./util').options(program)
		.parse(process.argv);
			
	});
}
