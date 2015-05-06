var path = require('path');
var program = require('commander');
var config = require('../package.json');

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
				var options = {};
				
				if (program.plugins) {
					options.plugins = program.plugins.split(',').map(function(plugin) {
						return /[^\w-]/i.test(plugin) ? path.resolve(plugin.trim()) : plugin;
					});
				}
				
				for (var i in require('./util').argv) {
					options[i] = program[i] || config[i];
				} 
				
				if (Array.isArray(config.ports)) {
					var port = options.port;
					config.ports.forEach(function(name) {
						options[name] = ++port;
					});
				}
				
				require(path)(options);
			});
	
		require('./util').options(program)
		.parse(process.argv);
			
	});
}
