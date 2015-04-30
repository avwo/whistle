var config = require('../util').config;

function setOptions(program) {
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
}