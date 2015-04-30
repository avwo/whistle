var http = require('http');
var rules = require('../rules');
var config = require('../../util').config;

function connect(req, callback) {
	var headers = req.headers;
	var options = req.options;
	
	var proxyClient = http.request({
		host: options.hostname,
		port: options.port || config.port,
		method: 'CONNECT',
		path: headers.host,
		agent: false,
		headers: {
			host: headers.host,
			'proxy-connection': 'keep-alive',
			'user-agent': headers['user-agent'] || config.name
		}
	})
	.on('error', abort)
	.on('connect', function (res, socket, head) {
		socket.on('error', abort);
		callback(null, socket);
	});
	req.pipe(proxyClient);
	
	req.on('error', abort);
	
	function abort(err) {
		proxyClient.abort();
		callback(err);
	}
}

module.exports = connect;