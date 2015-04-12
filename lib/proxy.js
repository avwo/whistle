var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var Transform = require('stream').Transform;
var util = require('../util');
var httpsHandler = require('../https');
var hosts = require('../data/hosts');
var meta = require('../data/meta');
var fileProxy = require('./file-proxy');
var httpProxy = require('./http-proxy');
var dataHandler = require('../data');
var finalHandler = require('./final-handler');
var errorHandler = require('./error-handler');
var tianmaHandler = require('../tianma');
var config = require('../package.json');
var domain = require('domain').create();

function tunnelProxy(server, proxy) {
	
	domain.on('error', util.noop);//ignore, prevent crash
	
	server.on('connect', function(req, reqSocket, head) {//ws, wss, https proxy
		var tunnelUrl = util.setProtocol(req.url, true);
		hosts.resolveHost(tunnelUrl, function(err, ip) {
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
	server.on('clientError', function(e) {
		//ignore，防止keepalive的socket发生error时，出现crash
	});
	
	app.use(httpsHandler.bind(proxyEvents)); //处理http转https请求
	app.use(dataHandler.bind(proxyEvents)); //收集请求数据
	
	if (Array.isArray(middlewares)) {
		middlewares.forEach(function(mw) {
			app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
		});
	}
	
	app.use(tianmaHandler.bind(proxyEvents));
	app.use(fileProxy.bind(proxyEvents));
	app.use(httpProxy.bind(proxyEvents));
	app.use(finalHandler.bind(proxyEvents));
	app.use(errorHandler.bind(proxyEvents));
	
	proxyEvents.hosts = hosts;
	proxyEvents.util = util;
	proxyEvents.metaUtil = meta;
	
	tunnelProxy(server, proxyEvents);
	
	return proxyEvents;
}

proxy.hosts = hosts;
proxy.util = util;
proxy.metaUtil = meta;

module.exports = proxy;