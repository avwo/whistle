var path = require('path');
var config = require('../../util').config;

function options(program) {
	return program
			.option('-r, --rules [rule file path]', 'rules file', String)
			.option('-n, --username [username]', 'login username', String)
			.option('-w, --password [password]', 'login password', String)
			.option('-p, --port [port]', config.name + ' port(' + config.port + ' by default)', parseInt)
			.option('-m, --plugins [script path or module name]', 'express middlewares(plugins) path (as: xx.js,yy/zz.js)', String)
			.option('-u, --uipath [script path]', 'web ui plugin path', String)
			.option('-t, --timneout [ms]', 'request timeout(' + config.timeout + ' ms by default)', parseInt)
			.option('-s, --sockets [number]', 'max sockets', parseInt)
			.option('-d, --days [number]', 'the maximum days of cache', parseInt)
			.option('-b, --bootstrap [script path]', 'automatic startup script path', String)
			.option('-c, --config [config file path]', 'startup config file path', String);
}

exports.options = options;

var excludes = ['commands', 'options', '_execs', '_allowUnknownOption',
                 '_args', '_name', 'Command', 'Option', '_version',
                 '_events', '_usage', 'rawArgs', 'args'];
exports.getOptions = function getOptions(program) {
	var options = {};
	Object.keys(program).forEach(function(name) {
		if (excludes.indexOf(name) == -1 && name.indexOf('_') !== 0 
				&& typeof program[name] != 'object') {
			options[name] = program[name];
		}
	});
	return options;
};

exports.resolvePath = function resolvePath(name) {
	return /^[\w-]+$/.test(name) ? name : path.resolve(name);
};

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

