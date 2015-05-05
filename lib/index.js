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
var config = util.config;

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
		
		function tunnel() {
			rules.resolveHost(tunnelUrl, function(err, ip) {
				req.host = ip;
				proxy.emit('tunnel', req);
				
				if (err) {
					emitError(err);
					return;
				}
				
				resSocket = net.connect(options.port, ip || options.hostname, function() {
					sendEstablished();
		            resSocket.pipe(reqSocket).pipe(resSocket);
		        });
				abortIfUnavailable(resSocket);
			});
		}
		
		var _rules = rules.resolveRules(removeDefaultPort(tunnelUrl));
		var proxyUrl = util.rule.getMatcher(_rules.proxy);
		if (proxyUrl) {
			var _tunnelUrl = 'https:' + util.removeProtocol(proxyUrl);
			rules.resolveHost(_tunnelUrl, function(err, ip) {
				req.host = ip;
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
				connect(req, function(err, _proxySocket) {
					if (err) {
						return emitError();
					}
					proxySocket = _proxySocket;
					abortIfUnavailable(_proxySocket);
					sendEstablished().pipe(_proxySocket).pipe(reqSocket);
				});
			});
		} else {
			tunnel();
		}
    });
	
	return server;
}

function removeDefaultPort(url) {
	var index = url.lastIndexOf(':');
	if (index != -1 && url.substring(index + 1) == '443') {
		url = url.substring(0, index);
	}
	
	return url;
}

process.on('uncaughtException', function(err){
	  fs.writeFileSync(path.join(process.cwd(), config.name + '-log.log'), err.stack + '\r\n', {flag: 'a'});
	  console.error(err);
	  process.exit(1);
});

function proxy(port, middlewares, _config) {
	if (Array.isArray(port)) {
		_config = middlewares;
		middlewares = port;
	} else if (!Array.isArray(middlewares)) {
		middlewares = [];
	}
	
	exnted(config, _config);
	var proxyEvents = new EventEmitter();
	var app = express();
	
	var server = app.listen(proxyEvents.port = port || config.port);
	
	middlewares = ['./init', 
	               '../biz']
				   .concat(require('./inspectors'))
				   .concat(middlewares)
	               .concat(['../biz/tianma'])
	               .concat(require('./handlers'));
	
	middlewares.forEach(function(mw) {
		app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
	});
	exportInterfaces(proxyEvents);
	tunnelProxy(server, proxyEvents);
	require('./proxy');
	return proxyEvents;
}

function exportInterfaces(obj) {
	obj.rules = rules;
	obj.util = util;
	obj.rulesUtil = rulesUtil;
	return obj;
}

module.exports = exportInterfaces(proxy);