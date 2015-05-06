var config = require('../util').config;

function options(program) {
	return program
			.option('-r, --rules [rule file path]', 'rules file', '')
			.option('-n, --username [username]', 'login username', '')
			.option('-w, --password [password]', 'login password', '')
			.option('-p, --port [port]', config.name + ' port(' + config.port + ' by default)', '')
			.option('-m, --plugins [file path or module name]', 'express middlewares(plugins) path (as: xx.js,yy/zz.js)', '')
			.option('-u, --uipath [file path]', 'web ui plugin path', '')
			.option('-t, --timneout [ms]', 'request timeout(' + config.timeout + ' ms by default)', parseInt)
			.option('-s, --sockets [number]', 'max sockets', parseInt)
			.option('-d, --days [number]', 'the maximum days of cache', parseInt);
}

exports.options = options;

exports.argv = {
		port : false, //is not path
		plugins : false,
		username : false,
		password : false,
		rules : true,
		uipath : true,
		timeout : false,
		sockets: false,
		days: false
	};

