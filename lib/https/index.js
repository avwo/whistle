var net = require('net');
var tls = require('tls');
var url = require('url');
var path = require('path');
var connect = require('../proxy/connect');
var util = require('../../util');
var rules = require('../rules');
var parseReq = require('../proxy/parse-req');
var cert = require('./cert');
var DEFAULT_CERT = cert.getDefault();
var LOCALHOST = '127.0.0.1';

function handleWebsocket(socket, wss, callback, app) {
	var config = app.config;
	var headers = socket.headers;
	var host = headers.host;
	var protocol = wss ? 'wss:' : 'ws:';
	var fullUrl = socket.fullUrl = protocol + '//' + headers.host + socket.url;
	var options = url.parse(fullUrl);
	var _rules = socket.rules = rules.resolveRules(fullUrl);
	var proxyUrl = util.rule.getMatcher(_rules.proxy);
	var reqSocket, options, matchedUrl;
	
	if (proxyUrl) {
		proxyUrl = protocol + util.removeProtocol(proxyUrl);
		rules.resolveHost(proxyUrl, function(err, ip) {
			if (err || !ip) {
				return callback(err || new Error('lookup DNS faild: ' + proxyUrl));
			}
			
			options = url.parse(proxyUrl);
			socket.options = {
					host: ip,
					port: options.port,
					isWs: !wss
			};
			connect(socket, function(err, proxySocket) {
				if (err) {
					return callback(err);
				}
				
				if (wss) {
					reqSocket = tls.connect({
				        rejectUnauthorized: false,
				        socket: proxySocket
				    }, pipeData);
				} else {
					reqSocket = proxySocket;
					pipeData();
				}
				
			});
			
		}, true);
		return;
	}
	
	matchedUrl = util.rule.getUrl(_rules.rule);
	if (/^wss?:\/\//.test(matchedUrl)) {
		fullUrl = matchedUrl;
	} else {
		matchedUrl = null;
	}
	
	options = url.parse(fullUrl);
	
	rules.resolveHost(fullUrl, function(err, ip) {
		if (err || !ip) {
			return callback(err || new Error('lookup DNS faild: ' + fullUrl));
		}
		var isWss = options.protocol == 'wss';
		reqSocket = (isWss ? tls : net).connect({
			rejectUnauthorized: false,
			host: ip,
			port: options.port || (isWss ? 443 : 80)
		}, pipeData);
		
	}, true);
	
	function pipeData() {
		reqSocket.write(socket.getBuffer());
		socket.pipe(reqSocket);
		parseReq(reqSocket, function(err, req) {
			if (err) {
				return callback(err);
			}
			socket.write(req.getBuffer());
			req.pipe(socket);
			callback(null, reqSocket);
		}, true);
	}
}

exports.dispatch = function dispatch(socket, app) {
	var config = app.config;
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
		if (/upgrade\s*:\s*websocket/i.test(buffer && buffer.toString())) { //ws
			parseReq(socket, function(err, socket) {
				if (err) {
					return destroy();
				}
				handleWebsocket(socket, false, function(err, req) {
					if (err) {
						return destroy();
					}
					reqSocket = req;
					abortIfUnavailable(reqSocket);
				}, app);
			}, buffer, true);
			buffer = null;
		} else {
			reqSocket = net.connect(config.httpsport, LOCALHOST, function() {
				reqSocket.write(buffer);
	            reqSocket.pipe(socket).pipe(reqSocket);
	            buffer = null;
	        });
			abortIfUnavailable(reqSocket);
		}
	}

};

exports.createServer = function createServer(app) {
	var config = app.config;
	var server = tls.createServer({
		SNICallback: function(hostname, callback) {
			if (typeof callback != 'function') {
				return cert.getCert();
			}
			
			callback(null, cert.getCert());
		},
		key: DEFAULT_CERT[0],
		cert: DEFAULT_CERT[1]
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
		parseReq(socket, function(err, socket) {
			if (err) {
				return destroy();
			}
			//wss
			
			var headers = socket.headers;
			if (headers.upgrade && headers.upgrade.toLowerCase() == 'websocket') {
				handleWebsocket(socket, true, function(err, req) {
					if (err) {
						return destroy();
					}
					reqSocket = req;
					abortIfUnavailable(reqSocket);
				}, app);
			} else {
				//https
				reqSocket = net.connect(config.port, LOCALHOST, function() {
					headers[util.HTTPS_FIELD] = 1;
					reqSocket.write(socket.getBuffer(headers));
					socket.pipe(reqSocket).pipe(socket);
		        });
				abortIfUnavailable(reqSocket);
			}
		}, true);
		
	}).listen(config.httpsport, 'localhost')
		.on('error', util.noop);
};
