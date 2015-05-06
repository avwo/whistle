var program = require('commander');
var config = require('../../util').config;
var util = require('./util');

require('./bootstrap')(function () {
	program
		.version(config.version)
		.usage('<command> [options]');
	program
		.command('run <path>')
		.description('Start a front service')
		.action(function (path) {
			for (var i in util.argv) {
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

	util.options(program)
	.parse(process.argv);
		
});
