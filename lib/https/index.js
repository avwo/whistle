var net = require('net');
var tls = require('tls');
var url = require('url');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var util = require('../util');
var config = require('../config');
var rules = require('../rules');
var pluginMgr = require('../plugins');
var serverAgent = require('./util').serverAgent;
var LOCALHOST = '127.0.0.1';
var ports = {};
var proxy;

function handleWebsocket(socket, clientIp, callback) {
	var wss = clientIp !== false;
	var reqEmitter = new EventEmitter();
	var headers = socket.headers;
	var fullUrl = socket.fullUrl = (wss ? 'wss:' : 'ws:') + '//' + headers.host + socket.url;
	var _rules = rules.resolveRules(fullUrl);
	var filter = rules.resolveFilter(fullUrl);
	var now = Date.now();
	var reqData = {
			ip: util.removeIPV6Prefix(clientIp || socket.remoteAddress),
			method: util.toUpperCase(socket.method) || 'GET', 
			httpVersion: socket.httpVersion || '1.1',
            headers: headers
		};
	var resData = {};
	var data = reqEmitter.data = {
			url: fullUrl,
			startTime: now,
			rules: _rules,
			req: reqData,
			res: resData
	};

	var options = url.parse(fullUrl);
	var proxyUrl = util.rule.getProxy(_rules.rule);
	var reqSocket, options, pluginHomePage, plugin, matchedUrl, timeout, done;
	plugin = pluginHomePage = pluginMgr.getPluginByHomePage(fullUrl);
	
	timeout = util.setTimeout(function() {
		destroy(new Error('timeout'));
	});
	
	function resolveHost(url, callback) {
		if (plugin) {
			return callback(LOCALHOST);
		}
		rules.resolveHost(url, function(err, ip) {
			if (err) {
				return execCallback(err);
			}
			
			resData.ip = ip;
			data.requestTime = data.dnsTime = Date.now();
			reqEmitter.emit('send', data);
			callback(ip);
		});
	}
	
	if (!pluginHomePage && proxyUrl) {
		!filter.hide && proxy.emit('request', reqEmitter);
		var isSocks = /^socks:\/\//.test(proxyUrl);
		data.realUrl = proxyUrl;
		proxyUrl = (wss ? 'wss:' : 'ws:') + util.removeProtocol(proxyUrl);
		resolveHost(proxyUrl, function(ip) {
			options = url.parse(proxyUrl);
			if ((!options.port || options.port == config.port) && util.isLocalAddress(ip)) {
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
		if (!pluginHomePage) {
			var ruleUrlValue = util.rule.getUrl(_rules.rule);
			if (/^wss?:\/\//.test(ruleUrlValue)) {
				data.realUrl = fullUrl = matchedUrl = ruleUrlValue;
			} else if (ruleUrlValue) {
				plugin = pluginMgr.getPluginByRuleUrl(ruleUrlValue);
			}
		}
		
		options = url.parse(fullUrl);
		!pluginHomePage && !filter.hide && proxy.emit('request', reqEmitter);
		
		if (plugin) {
			pluginMgr.loadPlugin(plugin, function(err, ports) {
				if (err) {
					return execCallback(err);
				}
				
				if (pluginHomePage && !ports.uiPort) {
					return execCallback('Not implemented');
				}
				
				var headers = socket.headers;
				if (options.protocol == 'wss:') {
					options.protocol = 'ws:';
					headers[pluginMgr.SSL_FLAG_HEADER] = 'true';
				}
				var ruleValue = _rules.rule && util.removeProtocol(_rules.rule.matcher, true);
				if (ruleValue) {
					headers[pluginMgr.RULE_VALUE_HEADER] = encodeURIComponent(ruleValue);
				}
				options.port = pluginHomePage ? ports.uiPort : ports.port;
				if (!pluginHomePage) {
					data.realUrl = util.changePort(fullUrl, options.port);
				}
				connect();
			});
		} else {
			connect();
		}
	}
	
	function connect() {
		resolveHost(fullUrl, function(ip) {
			var isWss = options.protocol == 'wss:';
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
			headers.origin = (options.protocol == 'wss:' ? 'https://' : 'http://') + options.host;
		}
		
		reqSocket.write(socket.getBuffer((plugin || matchedUrl) ? headers : null));
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
			resData.headers = headers;
			resData.statusCode = res.statusCode;
			reqEmitter.emit('response', data);
			execCallback(null, reqSocket);
		}, true);
	}
	
	function abortIfUnavailable(socket) {
		return socket.on('error', destroy)
			.on('close', destroy);
	}
	
	function destroy(err) {
		clearTimeout(timeout);
		socket.destroy();
		reqSocket && reqSocket.destroy();
		execCallback(err);
	}
	
	function execCallback(err, socket) {
		if (done) {
			return;
		}
		done = true;
		data.responseTime = data.endTime = Date.now();
		resData.ip = resData.ip || LOCALHOST;
		if (!err && !socket) {
			err = new Error('aborted');
			data.reqError = true;
			resData.statusCode ='aborted';
			reqData.body = util.getErrorStack(err);
			reqEmitter.emit('abort', data);
		} if (err) {
			data.resError = true;
			resData.statusCode = resData.statusCode || 502;
			resData.body = util.getErrorStack(err);
			util.emitError(reqEmitter, data);
		} else {
			reqEmitter.emit('end', data);
		}
		
		callback(err, socket);
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
			handleWebsocket(socket, clientIp, function(err, req) {
				if (err) {
					return destroy();
				}
				reqSocket = req;
				abortIfUnavailable(reqSocket);
			});
		} else {
			//https
			//如果延迟1s后，无法触发data事件
			var buffer;
			socket.on('data', function (data) {
				buffer = buffer ? Buffer.concat([buffer, data]) : data;
			});
			reqSocket = net.connect(config.port, LOCALHOST, function() {
				headers[config.HTTPS_FIELD] = 1;
				headers[config.CLIENT_IP_HEAD] = clientIp;
				reqSocket.write(socket.getBuffer(headers));
				socket.removeAllListeners('data');
				buffer && reqSocket.write(buffer);
				socket.pipe(reqSocket).pipe(socket);
	        });
			abortIfUnavailable(reqSocket);
		}
	}, true);
	

}

module.exports = function dispatch(socket, hostname, _proxy) {
	proxy = _proxy;
	
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
	socket.on('data', request);
	socket.on('end', request);

	
	function request(chunk) {
		socket.removeListener('data', request);
		socket.removeListener('end', request);
		if (!chunk) {//没有数据
			return destroy();
		}
		
		if (/upgrade\s*:\s*websocket/i.test(chunk.toString())) { //ws
			util.parseReq(socket, function(err, socket) {
				if (err) {
					return destroy();
				}
				handleWebsocket(socket, false, function(err, req) {
					if (err) {
						return destroy();
					}
					abortIfUnavailable(reqSocket = req);
				});
			}, chunk, true);
		} else {
			serverAgent.createServer(hostname, handleTlsSocket, function(port) {
				reqSocket = net.connect(port, LOCALHOST, function() {
					ports[reqSocket.localPort] = socket.remoteAddress;
					reqSocket.write(chunk);
		            reqSocket.pipe(socket).pipe(reqSocket);
		        });
				abortIfUnavailable(reqSocket);
			});
		}
	}

};



