var net = require('net');
var tls = require('tls');
var url = require('url');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var connect = require('../proxy/connect');
var util = require('../../util');
var rules = require('../rules');
var parseReq = require('../proxy/parse-req');
var cert = require('./cert');
var DEFAULT_CERT = cert.getDefault();
var LOCALHOST = '127.0.0.1';

function getFullUrl(socket, wss) {
	return (wss ? 'wss:' : 'ws:') + '//' + socket.headers.host + socket.url;
}

function getRequestEmitter(socket) {
	var reqEmitter = new EventEmitter();
	reqEmitter.url = getFullUrl(socket);
	reqEmitter.ip = socket.remoteAddress;
	reqEmitter.method = socket.method;
	reqEmitter.headers = socket.headers;
	reqEmitter.httpVersion = socket.httpVersion;
	return reqEmitter;
}

function handleWebsocket(socket, wss, callback, app) {
	var config = app.config;
	var reqEmitter = app.reqEmitter;
	var headers = socket.headers;
	var host = headers.host;
	var fullUrl = socket.fullUrl = getFullUrl(socket, wss);
	var options = url.parse(fullUrl);
	var _rules = reqEmitter.rules = rules.resolveRules(fullUrl);
	var proxyUrl = util.rule.getMatcher(_rules.proxy);
	var reqSocket, options, matchedUrl;
	var now = Date.now();
	
	function execCallback(err, socket) {
		err && util.emitError(reqEmitter, err);
		callback(err, socket);
	}
	
	if (proxyUrl) {
		proxyUrl = (wss ? 'wss:' : 'ws:') + util.removeProtocol(proxyUrl);
		rules.resolveHost(proxyUrl, function(err, ip) {
			if (err || !ip) {
				return execCallback(err || new Error('lookup DNS faild: ' + proxyUrl));
			}
			
			options = url.parse(proxyUrl);
			socket.options = {
					host: ip,
					port: options.port,
					isWs: !wss
			};
			reqEmitter.host = ip;
			reqEmitter.dnsTime = Date.now() - now;
			reqEmitter.emit('send');
			connect(socket, function(err, proxySocket) {
				if (err) {
					return execCallback(err);
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
			return execCallback(err || new Error('lookup DNS faild: ' + fullUrl));
		}
		reqEmitter.host = ip;
		reqEmitter.dnsTime = Date.now() - now;
		reqEmitter.emit('send');
		
		var isWss = options.protocol == 'wss';
		reqSocket = (isWss ? tls : net).connect({
			rejectUnauthorized: false,
			host: ip,
			port: options.port || (isWss ? 443 : 80)
		}, pipeData);
		
	}, true);
	
	function pipeData() {
		var headers = socket.headers;
		var origin;
		if (matchedUrl) {
			headers.host = options.host;
			origin = headers.origin;
			headers.origin = (options.protocol == 'wss' ? 'https://' : 'http://') + options.host;
		}
		
		reqSocket.write(socket.getBuffer(matchedUrl ? headers : null));
		socket.pipe(reqSocket);
		parseReq(reqSocket, function(err, res) {
			if (err) {
				return execCallback(err);
			}
			
			headers = res.headers;
			if (matchedUrl) {
				headers['access-control-allow-origin'] = origin;
			}
			socket.write(res.getBuffer(matchedUrl ? headers : null));
			res.pipe(socket);
			reqEmitter.emit('response', {
				headers: headers,
				realUrl: matchedUrl,
				statusCode: res.statusCode
			});
			execCallback(null, reqSocket);
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
				var reqEmitter = getRequestEmitter(socket);
				app.emit('websocket', reqEmitter);
				app.reqEmitter = reqEmitter;
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
				var reqEmitter = getRequestEmitter(socket);
				app.emit('websocket', reqEmitter);
				app.reqEmitter = reqEmitter;
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
