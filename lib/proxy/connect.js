var http = require('http');
var rules = require('../rules');

function connect(req, callback, defaultPort) {
	var headers = req.headers;
	var options = req.options;
	
	req.on('error', abort);
	
	var proxyClient = http.request({
		host: options.host,
		port: options.port || defaultPort,
		method: 'CONNECT',
		headers: {
			host: headers.host,
			'proxy-connection': 'keep-alive',
			'user-agent': headers['user-agent']
		}
	}).on('error', abort)
		.on('connect', function (res, socket, head) {
			callback(null, socket);
		});
	proxyClient.end();
	
	function abort(err) {
		proxyClient.abort();
		callback(err);
	}
}

module.exports = connect;