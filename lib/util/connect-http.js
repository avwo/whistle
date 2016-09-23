var http = require('http');
var tls = require('tls');
var util = require('./index');
var config = require('../config');

function connect(options, callback) {
	var done, timeout;
	var headers = options.headers = options.headers || {};
	options.method = 'CONNECT';
	options.headers['proxy-connection'] = 'keep-alive';
	options.agent = false;
	headers['user-agent'] = headers['user-agent'] || (config.name + '/' + config.version);
	options.port = options.port || 8888;
	
	function execCallback(err, socket) {
		clearTimeout(timeout);
		!done && callback(err, socket);
		done = true;
	}
	
	var host = headers.host;
	if (!host || typeof host != 'string') {
	  return execCallback(new Error('missing headers.host'));
  }
  
  if (host.indexOf(':') == -1) {
    headers.host += options.isHttps ? ':443' : ':80';
  }
  
  timeout = util.setTimeout(function() {
    execCallback(new Error('timeout'));
  });
	
	var client = http.request(options)
						.on('connect', function (res, socket, head) {
							socket.on('error', util.noop);
							execCallback(null, options.isHttps ? tls.connect({
						        rejectUnauthorized: false,
						        servername: host.split(':')[0],
						        socket: socket
						    }).on('error', util.noop) : socket);
						}).on('error', execCallback);
	client.end();
	return client;
}

module.exports = connect;