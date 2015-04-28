var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var exnted = require('util')._extend;
var util = require('../util');
var EventEmitter = require('events').EventEmitter;
var rules = require('./rules');
var rulesUtil = require('./rules/util');
var config = util.config;

function tunnelProxy(server, proxy) {
	
	server.on('connect', function(req, reqSocket, head) {//ws, wss, https proxy
		var tunnelUrl = req.url = util.setProtocol(req.url, true);
		var options = req.options = url.parse(tunnelUrl);
		if (!options.hostname && req.headers) {
			tunnelUrl = req.url = util.setProtocol(req.headers.host, true);
			options = req.options = url.parse(tunnelUrl);
		}
		var resSocket;
		function emitError(err) {
			resSocket && resSocket.destroy();
			reqSocket.destroy();
		}
		if (!options.port) {
			options.port = 443;
		}
		
		function abortIfUnavailable(socket) {
			socket.on('error', emitError).on('close', emitError);
		}
		
		abortIfUnavailable(reqSocket);
		rules.resolveHost(tunnelUrl, function(err, ip) {
			req.host = ip;
			if (!util.isLocalAddress(ip) || options.port!= proxy.uisslport) {
				proxy.emit('tunnel', req);
			} else {
				options.port = proxy.uisslport;
			}
			
			if (err) {
				emitError(err);
				return;
			}
			
			resSocket = net.connect(options.port, ip || options.hostname, function() {
	            reqSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n');
	            resSocket.pipe(reqSocket).pipe(resSocket);
	        });
			abortIfUnavailable(resSocket);
		});
    });
	
	return server;
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
	server.on('clientError', util.noop); //ignore，防止keepalive的socket发生error时，出现crash
	middlewares = ['./init', 
	               '../biz/webui']
				   .concat(require('./inspectors'))
				   .concat(middlewares)
	               .concat(['../biz/tianma'])
	               .concat(require('./handlers'));
	
	middlewares.forEach(function(mw) {
		app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
	});
	exportInterfaces(proxyEvents);
	tunnelProxy(server, proxyEvents);
	
	return proxyEvents;
}

function exportInterfaces(obj) {
	obj.rules = rules;
	obj.util = util;
	obj.rulesUtil = rulesUtil;
	return obj;
}

module.exports = exportInterfaces(proxy);