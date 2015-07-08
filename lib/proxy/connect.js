var http = require('http');
var rules = require('../rules');
var config = require('../../package.json');

function connect(req, callback) {
	var headers = req.headers;
	var options = req.options;
	
	req.on('error', abort);
	
	var proxyClient = http.request({
		host: options.host,
		port: options.port || config.port,
		method: 'CONNECT',
		headers: {
			host: headers.host,
			'proxy-connection': 'keep-alive',
			'user-agent': headers['user-agent'] || (config.name + '/' + config.version)
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