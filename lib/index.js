var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var Transform = require('stream').Transform;
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
			req.hosts = [ip, ip];
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

function proxy(port, middlewares) {
	if (Array.isArray(port)) {
		var tmp = middlewares;
		middlewares = port;
		port = tmp;
	}
	
	var proxyEvents = new EventEmitter();
	var app = express();
	
	var server = app.listen(proxyEvents.port = port || config.port);
	server.on('clientError', util.noop); //ignore，防止keepalive的socket发生error时，出现crash
	
	app.use(require('./inspectors').bind(proxyEvents));
	app.use(require('./inspectors/https').bind(proxyEvents)); //处理http转https请求
	app.use(require('./rules/resolve').bind(proxyEvents));
	app.use(require('./inspectors/req').bind(proxyEvents));
	app.use(require('./inspectors/res').bind(proxyEvents));
	app.use(require('./proxy').bind(proxyEvents)); //收集请求数据
	
	if (Array.isArray(middlewares)) {
		middlewares.forEach(function(mw) {
			app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
		});
	}
	
	app.use(require('../biz/tianma').bind(proxyEvents));
	app.use(require('./file-proxy').bind(proxyEvents));
	app.use(require('./http-proxy').bind(proxyEvents));
	app.use(require('./final-handler').bind(proxyEvents));
	app.use(require('./error-handler').bind(proxyEvents));
	
	proxyEvents.hosts = rules;
	proxyEvents.util = util;
	proxyEvents.metaUtil = rulesUtil;
	
	tunnelProxy(server, proxyEvents);
	
	return proxyEvents;
}

proxy.hosts = rules;
proxy.util = util;
proxy.metaUtil = rulesUtil;

module.exports = proxy;