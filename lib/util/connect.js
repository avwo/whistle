var http = require('http');
var config = require('../../package.json');

function connect(options, callback) {
	var done;
	options.method = 'CONNECT';
	options.headers['proxy-connection'] = 'keep-alive';
	options.agent = config.httpsProxyAgent;
	options.port = options.port || config.port;
	
	var proxy = http.request(options)
						.on('connect', function (res, socket, head) {
							callback(null, socket);
						}).on('error', abort);
	proxy.end();
	
	function abort(err) {
		if (!done) {
			done = true;
			proxy.abort();
			callback(err);
		}
	}
}

module.exports = connect;