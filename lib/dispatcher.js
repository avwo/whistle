var net = require('net');
var tls = require('tls');
var url = require('url');
var util = require('../util');
var parseReq = require('./proxy/parse-req');
var LOCALHOST = '127.0.0.1';

function createNetServer(app) {
	var config = app.config;
	var server = net.createServer(function(socket) {
		var reqSocket, buffer;
		var content = '';
		
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
			socket.removeListener('data', request);
			socket.removeListener('end', request);
			if (!chunk) {//没有数据
				return destroy();
			}
			
			buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
			if (buffer && buffer.toString().indexOf('\r\n') != -1) { //ws
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
							
							socket.write(reqSocket.getBuffer());
							reqSocket.pipe(socket);
						}, null, true);
			        });
					abortIfUnavailable(reqSocket);
				}, buffer, true);
				buffer = null;
			} else {
				reqSocket = net.connect(config.httpsport, LOCALHOST, function() {
					chunk ? reqSocket.write(buffer) : reqSocket.end(buffer);
		            reqSocket.pipe(socket).pipe(reqSocket);
		            buffer = null;
		        });
				abortIfUnavailable(reqSocket);
			}
		}
	}).listen(config.dispatcherport, 'localhost')
		.on('error', util.noop);
}

function createTLSServer(app) {
	var config = app.config;
	var server = tls.createServer({
		SNICallback: function(hostname, callback) {
			if (typeof callback == 'function') {
				callback();
				return;
			}
		}
	},function(socket) {
		var reqSocket;
		
		function destroy() {
			socket.destroy();
			reqSocket && reqSocket.destroy();
		}
		
		function abortIfUnavailable(socket) {
			return socket.on('error', destroy)
				.on('close', destroy);
		}
		
		abortIfUnavailable(socket);
//		socket.on('data', request);
//		socket.on('end', request);
//		
//		function request(chunk) {
//			
//		}
		parseReq(socket, function(err, socket) {
			if (err) {
				return destroy();
			}
			
			console.log(socket.headers);
		}, true);
		
	}).listen(config.httpsport, 'localhost')
		.on('error', util.noop);
}

module.exports = function init(app) {
	createNetServer(app);
	createTLSServer(app);
};