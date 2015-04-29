var http = require('http');
var rules = require('../rules');
var config = require('../../util').config;

function connect(req) {
	var headers = req.headers;
	var options = req.options;
	var done, proxyReq;
	
	var proxyClient = http.request({
		host: options.host,
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
	    proxyReq = tls.connect({
	        rejectUnauthorized: false,
	        socket: socket
	    }, function () {
	        req.pipe(socket).pipe(req);
	    });
	});
	proxyClient.end();
	
	req.on('error', abort);
	
	function abort(err, proxyRes) {
		proxyClient.abort();
		proxyReq && proxyReq.destroy();
	}
}

module.exports = connect;