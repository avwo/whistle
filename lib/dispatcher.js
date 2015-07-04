var net = require('net');
var tls = require('tls');
var url = require('url');
var util = require('../util');
var parseReq = require('./proxy/parse-req');
var StringDecoder = require('string_decoder').StringDecoder;
var MAX_SIZE = 1024 * 3;
var HEADERS_MAX_SIZE = 1024 * 128;

function createNetServer(app) {
	var config = app.config;
	var server = net.createServer(function(socket) {
		var reqSocket, buffer;
		var content = '';
		var decoder = new StringDecoder('utf8');
		
		function destroy() {
			socket.destroy();
			reqSocket && reqSocket.destroy();
		}
		
		function abortIfUnavailable(socket) {
			return socket.on('error', destroy)
				.on('close', destroy);
		}
		
		abortIfUnavailable(socket);
		socket.on('data', request);
		socket.on('end', request);
		
		function request(chunk) {
			if (reqSocket) {
				chunk ? reqSocket.write(chunk) : reqSocket.end();
				return;
			}
			
			if (chunk) {
				buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
				content += decoder.write(chunk);
			} else {
				content += decoder.end();
			}
			
			if (content.indexOf('\r\n') != -1) { //ws
				socket.removeListener('data', request);
				socket.removeListener('end', request);
				parseReq(socket, function(err, socket) {
					if (err) {
						return destroy();
					}
					var host = socket.headers.host;
					var fullUrl = socket.fullUrl = 'ws://' + socket.headers.host + socket.url;
					var options = url.parse(fullUrl);
					reqSocket = net.connect(options.port || 80, options.hostname, function() {
						reqSocket.write(socket.getBuffer());
						socket.pipe(reqSocket);
						parseReq(reqSocket, function(err, reqSocket) {
							if (err) {
								return destroy();
							}
							console.log(reqSocket.headers);
							socket.write(reqSocket.getBuffer());
							reqSocket.pipe(socket);
						}, null, true);
			        });
					abortIfUnavailable(reqSocket);
				}, buffer, true);
				buffer = null;
				return;
			}
			
			if (!chunk || buffer.length > MAX_SIZE) {
				reqSocket = net.connect(config.httpsport, '127.0.0.1', function() {
					chunk ? reqSocket.write(buffer) : reqSocket.end(buffer);
		            reqSocket.pipe(socket);
		            buffer = null;
		        });
				abortIfUnavailable(reqSocket);
			}
		}
	}).listen(config.dispatcherport, 'localhost')
		.on('error', util.noop);
}

function createTLSServer(app) {return;
	var config = app.config;
	var server = tls.createServer({
		
	},function(socket) {
		var reqSocket, buffer;
		var content = '';
		var decoder = new StringDecoder('utf8');
		
		function destroy() {
			socket.destroy();
			reqSocket && reqSocket.destroy();
		}
		
		function abortIfUnavailable(socket) {
			return socket.on('error', destroy)
				.on('close', destroy);
		}
		
		abortIfUnavailable(socket);
		socket.on('data', request);
		socket.on('end', request);
		
		function request(chunk) {
			if (reqSocket) {
				chunk ? reqSocket.write(chunk) : reqSocket.end();
				return;
			}
			
			buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
			content += chunk ? decoder.write(chunk) : decoder.end();
			var port;
			if (content.indexOf('\r\n') != -1) {
				port = config.port;
			} else if (!chunk || buffer.length > MAX_SIZE) {
				port = config.httpsport;
			}
			
			if (port) {
				reqSocket = net.connect(port, '127.0.0.1', function() {
					chunk ? reqSocket.write(buffer) : reqSocket.end(buffer);
		            reqSocket.pipe(socket);
		            buffer = null;
		        });
				abortIfUnavailable(reqSocket);
			}
		}
	}).listen(config.httpsport, 'localhost')
		.on('error', util.noop);
}

module.exports = function init(app) {
	createNetServer(app);
	createTLSServer(app);
};