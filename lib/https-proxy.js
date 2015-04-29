var net = require('net');
var url = require('url');
var PassThrough = require('stream').PassThrough;
var util = require('../util');
var rules = require('./rules');
var config = util.config;
var agent = {maxSockets: config.maxSockets || 10};
var CRLF = '\r\n';
var CRLF_BUF = new Buffer(CRLF);
var MAX_BYTES = 1024 * 256;
var TIMEOUT = config.timeout || 36000;

var server = net.createServer(function(socket) {
	var index = 0;
	var proxySocket, buffer, timeoutId;
	
	socket.on('error', emitError);
	socket.on('data', parseData);
	
	function parseData(data) {
		clearTimeout(timeoutId);
		buffer = buffer ? Buffer.concat([buffer, data]) : data;
		var endIndex = endIndexOf(buffer, index);
		if (endIndex == -1) {
			if (buffer.length > MAX_BYTES) {
				emitError();
			} else {
				timeoutId = setTimeout(emitError, TIMEOUT);
			}
			return;
		}
		
		socket.pause();
		socket.removeListener('data', parseData);
		var proxy = getOptions(buffer.slice(0, endIndex));
		if (!proxy || proxy.protocol != 'proxy:' || !proxy.hostname) {
			return emitError();
		}
		
		rules.resolveHost(proxy.hostname, function(err, ip) {
			if (err) {
				return emitError();
			}
			
			var options = {
					host: ip,
					port: proxy.port || 443,
					method: 'CONNECT',
					agent: agent
			};
			
			
			
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
			
		});
	}
	
	function emitError() {
		socket.destroy();
		proxySocket && proxySocket.destroy();
	}
	
}).listen(config.httpsproxyport, 'localhost')
.on('error', util.noop);

function getOptions(buffer) {
	var buffer = buffer.toString().trim().split(CRLF);
	var headers = {};
	
	for (var i = 1, len = buffer.length; i < len; i++) {
		var pair = getPair(buffer[i]);
		switch(pair.key) {
		case config.httpsProxyHead:
			break;
		case 'host':
			break;
		case 'user-agent':
			break;
		}
	}
	
	return proxy && url.parse(proxy);
}

function getPair(line) {
	if (!(line = line && line.trim())) {
		return;
	}
	
	var index = line.indexOf(':');
	return index != -1 ? {
		key: line.substring(0, index).trim().toLowerCase(),
		value: line.substring(index + 1).trim()
	} : null;
}

function endIndexOf(buffer, start, end) {
	start = start || 0;
	end = end || buffer.length;
	for (; start < end; start++) {
		if (buffer[start] == CRLF_BUF[0] && buffer[start + 1] == CRLF_BUF[1]
		&& buffer[start + 2] == CRLF_BUF[0] && buffer[start + 3] == CRLF_BUF[1]) {
			return start;
		}
	}
	
	return -1;
}
