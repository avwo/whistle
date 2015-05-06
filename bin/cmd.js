var program = require('commander');
var nodectl = require('./nodectl');
var bootstrap = require('./bootstrap');
var config = require('../util').config;
var bingo = false;

program
  .version(config.version)
  .usage('<command> [options]');

require('./util').setOptions(program);

program
	.command('run')
	.description('Start a front service')
	.action(function () {
		bingo = true;
		nodectl.run(program);
	});

program
	.command('start')
	.description('Start a background service')
	.action(function () {
		bingo = true;
		nodectl.start(program);
	});

program
	.command('stop')
	.description('Stop current background service')
	.action(function () {
		bingo = true;
		nodectl.stop(program);
	});

program
	.command('restart')
	.description('Restart current background service')
	.action(function () {
		bingo = true;
		nodectl.restart(program);
	});

program
	.command('help')
	.description('Display help information')
	.action(function () {
		bingo = true;
		program.help();
	});

bootstrap(function () {
	program.parse(process.argv);

	if (!bingo) {
		console.log('Type \'' + config.name + ' help\' for usage.');
	}
});