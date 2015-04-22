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
var config = require('../util').config;
var domain = require('domain').create();

function tunnelProxy(server, proxy) {
	
	domain.on('error', util.noop);//ignore, prevent crash
	
	server.on('connect', function(req, reqSocket, head) {//ws, wss, https proxy
		var tunnelUrl = util.setProtocol(req.url, true);
		rules.resolveHost(tunnelUrl, function(err, ip) {
			var options = req.options = url.parse(tunnelUrl);
			req.host = ip;
			if (!util.isLocalAddress(ip) || (options.port != proxy.port && options.port!= proxy.uisslport)) {
				proxy.emit('tunnel', req);
			} else {
				options.port = proxy.uisslport;
			}
			
			if (!err) {
				domain.run(function() {
					var resSocket = net.connect(options.port, ip || options.hostname, function() {
			            reqSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n');
			            resSocket.write(head);
			            resSocket.pipe(reqSocket).pipe(resSocket);
			        }).on('error', function(err) {
			        	resSocket.destroy();
			        });
				});
			}
			
		});
    });
	
	return server;
}

process.on('uncaughtException', function(err){
	  fs.writeFileSync(path.join(process.cwd(), config.name + '-log.log'), err.stack + '\r\n', {flag: 'a'});
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
	
	proxyEvents.rules = rules;
	proxyEvents.util = util;
	proxyEvents.rulesUtil = rulesUtil;
	
	tunnelProxy(server, proxyEvents);
	
	return proxyEvents;
}

proxy.rules = rules;
proxy.util = util;
proxy.rulesUtil = rulesUtil;

module.exports = proxy;