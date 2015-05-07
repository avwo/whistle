var program = require('commander');
var nodectl = require('./lib/nodectl');
var bootstrap = require('./lib/bootstrap');
var config = require('../util').config;
var util = require('./lib/util');
var bingo = false;

bootstrap(function () {
	process.nextTick(function() {
		if (program.config && program.config !== true) {
			require('util')._extend(config, require(program.config));
		}
		
		program
		  .version(config.version)
		  .usage('<command> [options]');

		program
			.command('run')
			.description('Start a front service')
			.action(function () {
				bingo = true;
				nodectl.run(getOptions());
			});

		program
			.command('start')
			.description('Start a background service')
			.action(function () {
				bingo = true;
				nodectl.start(getOptions());
			});

		program
			.command('stop')
			.description('Stop current background service')
			.action(function () {
				bingo = true;
				nodectl.stop(getOptions());
			});

		program
			.command('restart')
			.description('Restart current background service')
			.action(function () {
				bingo = true;
				nodectl.restart(getOptions());
			});

		program
			.command('help')
			.description('Display help information')
			.action(function () {
				bingo = true;
				program.help();
			});
		
		program
			.option('-r, --rules [rule file path]', 'rules file', String, undefined)
			.option('-n, --username [username]', 'login username', String, undefined)
			.option('-w, --password [password]', 'login password', String, undefined)
			.option('-p, --port [port]', config.name + ' port(' + config.port + ' by default)', parseInt, undefined)
			.option('-m, --plugins [script path or module name]', 'express middlewares(plugins) path (as: xx.js,yy/zz.js)', String, undefined)
			.option('-u, --uipath [script path]', 'web ui plugin path', String, undefined)
			.option('-t, --timneout [ms]', 'request timeout(' + config.timeout + ' ms by default)', parseInt, undefined)
			.option('-s, --sockets [number]', 'max sockets', parseInt, undefined)
			.option('-d, --days [number]', 'the maximum days of cache', parseInt, undefined)
			.option('-b, --bootstrap [script path]', 'automatic startup script path', String, undefined)
			.option('-c, --config [config file path]', 'startup config file path', String, undefined)
			.parse(process.argv);

		if (!bingo) {
			console.log('Type \'' + config.name + ' help\' for usage.');
		}
	});
});

function getOptions() {
	var options = {};
	Object.keys(program).forEach(function(name) {
		if (program.optionFor('--' + name)) {
			options[name] = program[name];
		}
	});
	
	if (program.middlewares) {
		options.plugins = options.plugins ? program.middlewares + ',' 
				+ options.plugins : program.middlewares;
	}
	
	return options;
}

module.exports = program;
