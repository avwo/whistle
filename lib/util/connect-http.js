var http = require('http');
var tls = require('tls');
var util = require('./index');
var config = require('../../package.json');

function connect(options, callback) {
	var done, timeout;
	var headers = options.headers = options.headers || {};
	options.method = 'CONNECT';
	options.headers['proxy-connection'] = 'keep-alive';
	options.agent = false;
	headers['user-agent'] = headers['user-agent'] || (config.name + '/' + config.version);
	options.port = options.port || config.port;
	
	if (headers.host && headers.host.indexOf(':') == -1) {
		headers.host += options.isHttps ? ':443' : ':80';
	}
	
	timeout = util.setTimeout(function() {
		execCallback(new Error('timeout'));
	});
	
	function execCallback(err, socket) {
		clearTimeout(timeout);
		!done && callback(err, socket);
		done = true;
	}
	
	var client = http.request(options)
						.on('connect', function (res, socket, head) {
							socket.on('error', util.noop);
							execCallback(null, options.isHttps ? tls.connect({
						        rejectUnauthorized: false,
						        socket: socket
						    }).on('error', util.noop) : socket);
						}).on('error', execCallback);
	client.end();
	return client;
}

module.exports = connect;