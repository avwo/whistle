var http = require('http');
var tls = require('tls');
var util = require('./index');
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
		headers.host += options.isHttps ? ':80' : ':443';
	}
	
	var client = http.request(options)
						.on('connect', function (res, socket, head) {
							socket.on('error', util.noop);
							callback(null, options.isHttps ? tls.connect({
						        rejectUnauthorized: false,
						        socket: socket
						    }).on('error', util.noop) : socket);
						}).on('error', function(err) {
							!done && callback(err);
							done = true;
						});
	client.end();
	return client;
}

module.exports = connect;