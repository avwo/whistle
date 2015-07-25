var http = require('http');
var config = require('../../package.json');

function connect(options, callback) {
	var done;
	var headers = options.headers = options.headers || {};
	options.method = 'CONNECT';
	options.headers['proxy-connection'] = 'keep-alive';
	options.agent = false;
	headers['user-agent'] = headers['user-agent'] || (config.name + '/' + config.version);
	options.port = options.port || config.port;
	
	if (headers.host && headers.host.indexOf(':') == -1) {
		headers.host += options.isWs ? ':80' : ':443';
	}
	
	http.request(options)
						.on('connect', function (res, socket, head) {
							socket.on('error', noop);
							callback(null, socket);
						}).on('error', function(err) {
							!done && callback(err);
							done = true;
						}).end();
}

function noop() {}

module.exports = connect;