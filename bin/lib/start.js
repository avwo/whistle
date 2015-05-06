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
			var options = util.getOptions(program);
			
			if (options.config) {
				var _config = require(options.config) || {};
				if (Array.isArray(_config.ports)) {
					config.ports = config.ports.concat(_config.ports);
				}
				delete _config.ports;
				delete options.config;
				options = require('util')._extend(_config, options);
			}
			
			var argv = util.argv;
			
			for (var i in options) {
				var opt = options[i] == null ? config[i] : options[i];
				config[i] = argv[i] ? util.resolvePath(opt) : opt;
			}
			
			if (config.plugins) {
				config.plugins = config.plugins.split(',')
						.map(function(plugin) {
							return util.resolvePath(plugin.trim());
						});
			}
			
			if (Array.isArray(config.ports)) {
				var port = config.port;
				config.ports.forEach(function(name) {
					config[name] = ++port;
				});
			}
			
			require(path)(config);
			options.bootstrap && require(options.bootstrap)(config);
		});

	util.options(program)
	.parse(process.argv);
		
});
