var program = require('commander');
var nodectl = require('./lib/nodectl');
var bootstrap = require('./lib/bootstrap');
var config = require('../util').config;
var util = require('./lib/util');
var bingo = false;

bootstrap(function () {
	process.nextTick(function() {
		if (program.config) {
			require('util')._extend(config, require(program.config));
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
				nodectl.run(util.getOptions(program));
			});

		program
			.command('start')
			.description('Start a background service')
			.action(function () {
				bingo = true;
				nodectl.start(util.getOptions(program));
			});

		program
			.command('stop')
			.description('Stop current background service')
			.action(function () {
				bingo = true;
				nodectl.stop(util.getOptions(program));
			});

		program
			.command('restart')
			.description('Restart current background service')
			.action(function () {
				bingo = true;
				nodectl.restart(util.getOptions(program));
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

module.exports = program;
