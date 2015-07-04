var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var exnted = require('util')._extend;
var util = require('../util');
var rules = require('./rules');
var rulesUtil = require('./rules/util');
var connect = require('./proxy/connect');
var config = require('../package.json');

function tunnelProxy(server, proxy) {
	
	server.on('connect', function(req, reqSocket, head) {//ws, wss, https proxy
		var tunnelUrl = req.url = util.setProtocol(req.url, true);
		var options = parseUrl();
		var resSocket, proxySocket;
		
		if (!options.hostname) {
			tunnelUrl = req.url = util.setProtocol(req.headers.host, true);
			parseUrl();
		}
		
		abortIfUnavailable(reqSocket);
		function emitError(err) {
			resSocket && resSocket.destroy();
			proxySocket && proxySocket.destroy();
			reqSocket.destroy();
		}
		
		function abortIfUnavailable(socket) {
			socket.on('error', emitError).on('close', emitError);
		}
		
		function parseUrl(_tunnelUrl, port) {
			_tunnelUrl = _tunnelUrl || tunnelUrl;
			options = req.options = url.parse(_tunnelUrl);
			options.port = options.port || port || 443;
			return options;
		}
		
		function sendEstablished() {
			reqSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n');
			return reqSocket;
		}
		
		function tunnel(url) {
			var now = Date.now();
			rules.resolveHost(url || tunnelUrl, function(err, ip) {
				req.host = ip;
				req.clientHost  = reqSocket.remoteAddress;
				req.error = err;
				req.dnsTime = Date.now() - now;
				proxy.emit('tunnel', req);
				
				if (err) {
					emitError(err);
					return;
				}
				
				resSocket = net.connect(options.port, ip, function() {
					sendEstablished();
		            resSocket.pipe(reqSocket).pipe(resSocket);
		        });
				abortIfUnavailable(resSocket);
			});
		}
		
		var _rules = req.rules = rules.resolveRules(tunnelUrl);
		var proxyUrl = util.rule.getMatcher(_rules.proxy);
		
		if (proxyUrl) {
			var _tunnelUrl = 'https:' + util.removeProtocol(proxyUrl);
			var now = Date.now();
			rules.resolveHost(_tunnelUrl, function(err, ip) {
				req.host = ip;
				req.error = err;
				req.dnsTime = Date.now() - now;
				parseUrl(_tunnelUrl, config.port);
				if (!err && util.isLocalAddress(ip) && options.port == config.port) {
					parseUrl();
					return tunnel();
				}
				proxy.emit('tunnelProxy', req);
				if (err) {
					emitError(err);
					return;
				}
				options.host = ip;
				connect(req, config, function(err, _proxySocket) {
					if (err) {
						return emitError();
					}
					proxySocket = _proxySocket;
					abortIfUnavailable(_proxySocket);
					sendEstablished().pipe(_proxySocket).pipe(reqSocket);
				});
			});
		} else {
			if (_rules.rule) {
				var _url = util.setProtocol(util.rule.getMatcher(_rules.rule), true);
				if (/^https:/i.test(_url)) {
					parseUrl(_url);
				} else {
					var port = util.getProtocol(_url);
					port = port.substring(0, port.length - 1);
					var localProtocol = port + 'sslport';
					if (port = config[localProtocol]) {
						proxy.emit(localProtocol, _url, tunnelUrl);
						parseUrl(_url);
						options.protocol = 'https:';
						options.hostname = '127.0.0.1';
						options.host = options.hostname + ':' + port;
						options.port = port;
						_url = 'ssl://' + options.host; //不解析_url的ip
					} else {
						_url = null;//如果规则无法处理，则直接访问
					}
				}
			}
			
			tunnel(_url);
		}
    });
	
	return server;
}

function preventThrowError(socket) {
	socket.removeListener('error', util.noop);
	socket.on('error', util.noop);
}

function proxy(conf) {
	if (conf) {
		['port', 'sockets', 'days', 'timeout',
		 'username', 'password', 'uipath', 'rules', 'debug']
			.forEach(function(name) {
				if (conf[name]) {
					config[name] = conf[name];
				}
			});
		
		if (Array.isArray(conf.ports)) {
			config.ports = config.ports.concat(conf.ports);
		}
	}
	
	if (!conf || typeof conf.middlewares != 'string') {
		if (!Array.isArray(conf.middlewares)) {
			config.middlewares = [];
		}
	} else {
		config.middlewares = conf.middlewares.trim().split(/\s*,\s*/g);
	}
	
	config.middlewares.map(util.resolvePath);
	
	var port = config.port;
	config.ports.forEach(function(name) {
		if (!/port$/.test(name) || name == 'port') {
			throw new Error('port name "' + name + '" must be end of "port", but not equals "port", like: ' + name + 'port');
		}
		config[name] = ++port;
	});
	
	var agentConfig = {
				maxSockets: config.sockets, 
				keepAlive: config.keepAlive, 
				keepAliveMsecs: config.keepAliveMsecs
			};
	config.httpAgent = config.debug ? false : new (require('http').Agent)(agentConfig).on('free', preventThrowError);
	config.httpsAgent = config.debug ? false : new (require('https').Agent)(agentConfig).on('free', preventThrowError);
	config.WEINRE_HOST = 'weinre.' + config.localUIHost;
	
	var app = express();
	var server = app.listen(config.port);
	var proxyEvents = new EventEmitter();
	var middlewares = ['./init', 
	               '../biz']
				   .concat(require('./inspectors'))
				   .concat(config.middlewares)
	               .concat(require('./handlers'));
	
	proxyEvents.config = config;
	middlewares.forEach(function(mw) {
		mw && app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
	});
	
	parseHosts(config);
	exportInterfaces(proxyEvents);
	tunnelProxy(server, proxyEvents);
	require('./dispatcher')(proxyEvents);
	require('./proxy')(proxyEvents);
	require('../biz/init')(proxyEvents);
	
	return proxyEvents;
}

function exportInterfaces(obj) {
	obj.rules = rules;
	obj.util = util;
	obj.rulesUtil = rulesUtil;
	return obj;
}

function parseHosts(config) {
	var rulesPath = config.rules;
	if (rulesPath) {
		try {
			rulesUtil.setPublicHosts(fs.readFileSync(path.resolve(rulesPath), {encoding: 'utf8'}));
			rulesUtil.enablePublicHosts();
		} catch(e) {}
	}
	
	rulesUtil.loadHosts(config);
}

process.on('uncaughtException', function(err){
	var stack = err.message + '\r\n' + err.stack;
	fs.writeFileSync(path.join(process.cwd(), config.name + '.log'), '\r\n' + util.formatDate()  + '\r\n' +  stack + '\r\n', {flag: 'a'});
	console.error(stack);
	process.exit(1);
});

module.exports = exportInterfaces(proxy);