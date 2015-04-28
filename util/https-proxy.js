var http = require('http');
var agent = new (http.Agent)({maxSockets: 8});
var tls = require('tls');
var CRLF = '\r\n';
var IncomingMessage = require('./http-incoming');

function getHeadersContent(req) {
	var headers = [req.method + ' ' + req.url + ' HTTP/' + req.httpVersion];
	if (req.headers && !req.headers.Host) {
		req.headers.Host = req.headers.host;
	}
	for (var key in req.headers) {
		var line = req.headers[key];
		if (Array.isArray(line)) {
			line.forEach(function(value) {
				headers.push(key + ': ' + value);
			});
		} else {
			headers.push(key + ': ' + line);
		}
	}
	headers.push(CRLF);
	
	return headers.join(CRLF);
}

module.exports = function proxy(req, callback) {
	var headers = req.headers;
	var options = req.options;
	var done, proxyReq;
	
	function execCallback(err, proxyRes) {
		if (!done) {
			callback && callback(err, proxyRes);
			done = true;
		}
	}
	
	options.method = 'CONNECT';
	options.path = headers.host;
	if (options.agent == null) {
		options.agent = agent;
	}
	options.headers = {
			host : headers.host,
			'proxy-connection': 'keep-alive',
			'user-agent': headers['user-agent']
		};
	
	var connect = http.request(options).on('error', execCallback)
	.on('connect', function (res, socket, head) {
		socket.on('error', execCallback);
	    proxyReq = tls.connect({
	        rejectUnauthorized: false,
	        socket: socket
	    }, function () {
	        proxyReq.write(getHeadersContent(req));
	        req.pipe(proxyReq);
	        
	        var proxyRes = new IncomingMessage(proxyReq);
	        proxyRes.on('response', function(res) {
		    	execCallback(null, res);
		    });
	        proxyRes.on('error', execCallback);
	    });
	});
	connect.end();
	
	req.on('error', function(err) {
		connect.abort();
		proxyReq && proxyReq.destroy();
	});
};


