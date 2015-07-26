var net = require('net');
var tls = require('tls');
var url = require('url');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var util = require('../util');
var rules = require('../rules');
var serverAgent = require('./util').serverAgent;
var LOCALHOST = '127.0.0.1';
var ports = {};
var config, app;

function getFullUrl(socket, wss) {
	return (wss ? 'wss:' : 'ws:') + '//' + socket.headers.host + socket.url;
}

function getRequestEmitter(socket, wss) {
	var reqEmitter = new EventEmitter();
	reqEmitter.url = getFullUrl(socket, wss);
	reqEmitter.ip = socket.remoteAddress;
	reqEmitter.method = socket.method;
	reqEmitter.headers = socket.headers;
	reqEmitter.httpVersion = socket.httpVersion;
	socket.fullUrl = getFullUrl(socket, wss);
	reqEmitter.rules = rules.resolveRules(socket.fullUrl);
	reqEmitter.hide = reqEmitter.rules.filter && reqEmitter.rules.filter.hide;
	return reqEmitter;
}

function handleWebsocket(socket, wss, callback) {
	var reqEmitter = app.reqEmitter;
	var headers = socket.headers;
	var host = headers.host;
	var fullUrl = socket.fullUrl;
	var options = url.parse(fullUrl);
	var _rules = reqEmitter.rules;
	var proxyUrl = util.rule.getMatcher(_rules.proxy);
	var reqSocket, options, matchedUrl;
	var now = Date.now();
	var timeout, done;
	var mustRemoteHost = reqEmitter.rules.filter && reqEmitter.rules.filter.host;
	
	function destroy(err) {
		clearTimeout(timeout);
		socket.destroy();
		reqSocket && reqSocket.destroy();
		util.emitError(reqEmitter, err || new Error('aborted'));
	}
	
	function abortIfUnavailable(socket) {
		return socket.on('error', destroy)
			.on('close', destroy);
	}
	
	function execCallback(err, socket) {
		if (done) {
			return;
		}
		done = true;
		err && util.emitError(reqEmitter, err);
		callback(err, socket);
	}
	
	timeout = util.setTimeout(function() {
		destroy(new Error('timeout'));
	});
	
	function resolveHost(url, callback) {
		rules.resolveHost(proxyUrl, function(err, ip, customHost) {
			if (err) {
				reqEmitter.host = LOCALHOST;
				return execCallback(err);
			}
			
			reqEmitter.customHost = customHost;
			reqEmitter.host = ip;
			reqEmitter.dnsTime = Date.now() - now;
			reqEmitter.emit('send');
			callback(ip);
		}, mustRemoteHost);
	}
	
	if (proxyUrl) {
		var isSocks = /^socks:\/\//.test(proxyUrl);
		proxyUrl = (wss ? 'wss:' : 'ws:') + util.removeProtocol(proxyUrl);
		resolveHost(proxyUrl, function(ip) {
			options = url.parse(proxyUrl);
			if (util.isLocalAddress(ip) && (!options.port || options.port == config.port)) {
				return execCallback(new Error('Unable to agent to itself (' + ip + ':' + config.port + ')')); 
			}
			util.connect({
				isSocks: isSocks,
				host: ip,
				port: options.port,
				isHttps: wss,
				url: fullUrl,
				auth: options.auth,
				headers: {
					host: headers.host,
					'proxy-connection': 'keep-alive',
					'user-agent': headers['user-agent']
				}
			}, function(err, proxySocket) {
				if (err) {
					return execCallback(err);
				}
				
				reqSocket = proxySocket;
				abortIfUnavailable(reqSocket);
				pipeData();
			});
		});
	} else {
		matchedUrl = util.rule.getUrl(_rules.rule);
		if (/^wss?:\/\//.test(matchedUrl)) {
			reqEmitter.realUrl = fullUrl = matchedUrl;
		} else {
			matchedUrl = null;
		}
		
		options = url.parse(fullUrl);
		resolveHost(fullUrl, function(ip) {
			var isWss = options.protocol == 'wss';
			reqSocket = (isWss ? tls : net).connect({
				rejectUnauthorized: false,
				host: ip,
				port: options.port || (isWss ? 443 : 80)
			}, pipeData);
			abortIfUnavailable(reqSocket);
		});
	}
	
	
	function pipeData() {
		clearTimeout(timeout);
		var headers = socket.headers;
		var origin;
		if (matchedUrl) {
			headers.host = options.host;
			origin = headers.origin;
			headers.origin = (options.protocol == 'wss' ? 'https://' : 'http://') + options.host;
		}
		
		reqSocket.write(socket.getBuffer(matchedUrl ? headers : null));
		socket.pipe(reqSocket);
		util.parseReq(reqSocket, function(err, res) {
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

function handleTlsSocket(socket) {
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
	util.parseReq(socket, function(err, socket) {
		if (err) {
			return destroy();
		}
		//wss
		var clientIp = ports[socket.remotePort];
		var headers = socket.headers;
		if (headers.upgrade && headers.upgrade.toLowerCase() == 'websocket') {
			var reqEmitter = getRequestEmitter(socket, true);
			reqEmitter.ip = clientIp;
			!reqEmitter.hide && app.emit('websocket', reqEmitter);
			app.reqEmitter = reqEmitter;
			handleWebsocket(socket, true, function(err, req) {
				if (err) {
					return destroy();
				}
				reqSocket = req;
				abortIfUnavailable(reqSocket);
			});
		} else {
			//https
			reqSocket = net.connect(config.port, LOCALHOST, function() {
				headers[util.HTTPS_FIELD] = 1;
				headers[util.CLIENT_IP_HEAD] = clientIp;
				reqSocket.write(socket.getBuffer(headers));
				socket.pipe(reqSocket).pipe(socket);
	        });
			abortIfUnavailable(reqSocket);
		}
	}, true);
	

}

module.exports = function dispatch(socket, hostname, _app) {
	app = _app;
	config = app.config;
	
	var reqSocket, buffer;
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
			util.parseReq(socket, function(err, socket) {
				if (err) {
					return destroy();
				}
				var reqEmitter = getRequestEmitter(socket);
				!reqEmitter.hide && app.emit('websocket', reqEmitter);
				app.reqEmitter = reqEmitter;
				handleWebsocket(socket, false, function(err, req) {
					if (err) {
						return destroy();
					}
					abortIfUnavailable(reqSocket = req);
				});
			}, buffer, true);
			buffer = null;
		} else {
			serverAgent.createServer(hostname, handleTlsSocket, function(port) {
				reqSocket = net.connect(port, LOCALHOST, function() {
					ports[reqSocket.localPort] = socket.remoteAddress;
					reqSocket.write(buffer);
		            reqSocket.pipe(socket).pipe(reqSocket);
		            buffer = null;
		        });
				abortIfUnavailable(reqSocket);
			});
		}
	}

};



