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
			var argv = util.argv;
			
			for (var i in options) {
				var opt = options[i] == null ? config[i] : options[i];
				config[i] = argv[i] ? util.resolvePath(opt) : opt;
			}
			
			if (config.plugins) {
				config.plugins = config.plugins.split(',')
						.map(function(plugin) {
							return util.resolvePath(plugin);
						});
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
