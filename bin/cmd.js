var program = require('commander');
var nodectl = require('./nodectl');
var bootstrap = require('./bootstrap');
var config = require('../package.json');
var bingo = false;

program
  .version(config.version)
  .usage('<command> [options]');

program
	.option('-f, --hosts [host]', 'hosts file', '')
	.option('-p, --port [port]', config.name + ' port(' + config.port + ' by default)', '')
	.option('-m, --plugins [plugins]', 'express middlewares(plugins) path (as: xx.js,yy/zz.js)', '')
	.option('-d, --uiport [uiport]', 'web ui http port(' + config.uiport + ' by default)', '')
	.option('-s, --uisslport [uisslport]', 'web ui https port(' + config.uisslport + ' by default)', '')
	.option('-a, --tianmaport [uisslport]', 'tianma http port(' + config.tianmaport + ' by default)', '')
	.option('-A, --tianmasslport [uisslport]', 'tianma https port(' + config.tianmasslport + ' by default)', '')
	.option('-u, --uipath [uipath]', 'web ui plugin path', '')
	.option('-t, --timneout [timneout]', 'request timeout(' + config.timeout + ' ms by default)', parseInt);

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
		nodectl.stop();
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