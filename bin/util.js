var config = require('../util').config;

function setOptions(program) {
	return program
			.option('-f, --hosts [host]', 'hosts file', '')
			.option('-n, --username [username]', 'login username', '')
			.option('-w, --password [password]', 'login password', '')
			.option('-p, --port [port]', config.name + ' port(' + config.port + ' by default)', '')
			.option('-m, --plugins [plugins]', 'express middlewares(plugins) path (as: xx.js,yy/zz.js)', '')
			.option('-u, --uipath [uipath]', 'web ui plugin path', '')
			.option('-t, --timneout [timneout]', 'request timeout(' + config.timeout + ' ms by default)', parseInt)
			.option('-s, --sockets [sockets]', 'max sockets', parseInt)
			.option('-a, --keepAlive [keepAlive]', 'keep alive', '')
			.option('-d, --days [days]', 'the maximum days of cache', parseInt);
}

exports.setOptions = setOptions;