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
		
		if (program.middlewares) {
			program.middlewares
		}
		
		program
		  .version(config.version)
		  .usage('<command> [options]');

		require('./lib/util').options(program);

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
		
		program.parse(process.argv);

		if (!bingo) {
			console.log('Type \'' + config.name + ' help\' for usage.');
		}
	});
});

function getOptions() {
	var options = util.getOptions(program);
	if (program.middlewares) {
		options.plugins = options.plugins ? program.middlewares + ',' 
				+ options.plugins : program.middlewares;
		delete program.middlewares;
	}
	return options;
}

module.exports = program;
