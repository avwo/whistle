var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var tls = require('tls');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var exnted = require('util')._extend;
var util = require('./util');
var rules = require('./rules');
var dispatch = require('./https');
var httpsUtil = require('./https/util');
var rulesUtil = require('./rules/util');
var initDataServer = require('./util/data-server');
var initLogServer = require('./util/log-server');
var config = require('../package.json');
var LOCALHOST = '127.0.0.1';


function tunnelProxy(server, proxy) {
	//see: https://github.com/joyent/node/issues/9272
	if (typeof tls.checkServerIdentity == 'function') {
		var checkServerIdentity = tls.checkServerIdentity;
		tls.checkServerIdentity = function() {
			try {
				return checkServerIdentity.apply(this, arguments);
			} catch(err) {
				return err;
			}
		};
	}
	
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
	server.on('connect', function(req, reqSocket, head) {//ws, wss, https proxy
		var tunnelUrl = req.url = util.setProtocol(req.url, true);
		var options = parseUrl();
		var resSocket, proxySocket, responsed;
		
		if (!options.hostname) {
			tunnelUrl = req.url = util.setProtocol(req.headers.host, true);
			options = parseUrl();
		}
		var hostname = options.hostname;
		abortIfUnavailable(reqSocket);
		var _rules = req.rules = rules.resolveRules(tunnelUrl);
		var filter = rules.resolveFilter(tunnelUrl);
		
		if (/local\.whistlejs\.com$/.test(hostname) || filter.https 
				|| (rulesUtil.properties.get('interceptHttpsConnects') && !filter.intercept)) {
			sendEstablished();
			dispatch(reqSocket, hostname, proxy);
			return;
		}
		
		var reqEmitter = new EventEmitter();
		var headers = req.headers;
		var reqData = {
				ip: util.getClientIp(req) || LOCALHOST,
				method: util.toUpperCase(req.method) || 'CONNECT', 
				httpVersion: req.httpVersion || '1.1',
	            headers: headers
			};
		var resData = {headers: {}};
		var data = reqEmitter.data = {
				url: options.host,
				startTime: Date.now(),
				rules: _rules,
				req: reqData,
				res: resData,
				isHttps: true
		};
		
		var proxyUrl = util.rule.getProxy(_rules.rule);
		if (proxyUrl) {
			var isSocks = /^socks:\/\//.test(proxyUrl);
			data.realUrl = proxyUrl;
			var _url = 'https:' + util.removeProtocol(proxyUrl);
			data.proxy = true;
			resolveHost(_url, function(ip) {
				if (options.port == config.port && util.isLocalAddress(ip)) {
					options = parseUrl();
					return tunnel();
				}
				options = parseUrl(_url, isSocks ? 1080 : 8888);
				var opts = url.parse(tunnelUrl);
				headers.host = opts.hostname + ':' + (opts.port || 443);
				util.connect({
					isSocks: isSocks,
					host: ip,
					port: options.port,
					auth: options.auth,
					url: 'http://' + headers.host,
					headers: headers
				}, function(err, _proxySocket) {
					if (err) {
						return emitError(err);
					}
					proxySocket = _proxySocket;
					abortIfUnavailable(proxySocket);
					sendEstablished().pipe(proxySocket).pipe(reqSocket);
				});
			});
		} else {
			if (_rules.rule) {
				var _url = util.setProtocol(util.rule.getMatcher(_rules.rule), true);
				if (/^https:/i.test(_url)) {
					options = parseUrl(_url);
					data.realUrl = _url;
				} else {
					var protocol = util.getProtocol(_url);
					protocol = protocol.substring(0, protocol.length - 1);
					var localProtocol = protocol + 'sslport';
					var port = config[localProtocol];
					if (port) {
						data.realUrl = _url;
						proxy.emit(localProtocol, {
							rule: _url,
							url: tunnelUrl,
							type: protocol,
							callback: function (err, data) {
								if (err) {
									return emitError(err);
								}
								if (data && data.port > 0) {
									port = data.port;
								}
								options = parseUrl(_url);
								options.protocol = 'https:';
								options.hostname = LOCALHOST;
								options.host = options.hostname + ':' + port;
								options.port = port;
								tunnel('https://' + hostname + ':' + port, options.hostname);
							}
						});
						return;
					} else {
						_url = null;//如果规则无法处理，则直接访问
					}
				}
			}
			
			tunnel(_url);
		}
		
		function tunnel(url, ip) {
			resolveHost(url || tunnelUrl, function(ip) {
				resSocket = net.connect(options.port, ip, function() {
		            resSocket.pipe(reqSocket).pipe(resSocket);
		            sendEstablished();
		        });
				abortIfUnavailable(resSocket);
			}, ip);
		}
		
		function parseUrl(_url, port) {
			_url = _url || tunnelUrl;
			options = req.options = url.parse(_url);
			options.port = options.port || port || 443;
			return options;
		}
		
		function resolveHost(url, callback, ip) {
			if (!rulesUtil.properties.get('hideHttpsConnects') && !filter.hide) {
				proxy.emit('request', reqEmitter);
			} 
			
			rules.resolveHost(ip || url, function(err, ip) {
				data.requestTime = data.dnsTime = Date.now();
				resData.ip = ip || LOCALHOST;
				reqEmitter.emit('send', data);
				err ? emitError(err) : callback(ip);
			}, filter.host);
		}
		
		function abortIfUnavailable(socket) {
			socket.on('error', emitError).on('close', emitError);
		}
		
		function sendEstablished() {
			reqSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n');
			responsed = true;
			if (!reqEmitter) {
				return;
			}
			data.responseTime = data.endTime = Date.now();
            resData.statusCode = 200;
			reqEmitter.emit('response', data);
			reqEmitter.emit('end', data);
			return reqSocket;
		}
		
		function emitError(err) {
			if (responsed) {
				return;
			}
			responsed = true;
			resSocket && resSocket.destroy();
			proxySocket && proxySocket.destroy();
			reqSocket.destroy();
			data.responseTime = data.endTime = Date.now();
			
			if (!resData.ip) {
				resData.ip = LOCALHOST;
			}
			
			if (err) {
				err = new Error('aborted');
				data.reqError = true;
				resData.statusCode ='aborted';
				reqData.body = util.getErrorStack(err);
				reqEmitter.emit('abort', data);
			} else {
				data.resError = true;
				resData.statusCode = resData.statusCode || 502;
				resData.body = util.getErrorStack(err);
				util.emitError(reqEmitter, data);
			}
		}
    });
	
	return server;
}

function proxy(conf) {
	if (conf) {
		['port', 'sockets', 'timeout', 'registry',
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
	config.httpAgent = config.debug ? false : util.createAgent(agentConfig);
	config.httpsAgent = config.debug ? false : util.createAgent(agentConfig, true);
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
	initDataServer(proxyEvents);
	initLogServer(proxyEvents);
	require('../biz/init')(proxyEvents);
	
	return proxyEvents;
}

function exportInterfaces(obj) {
	obj.rules = rules;
	obj.util = util;
	obj.rulesUtil = rulesUtil;
	obj.httpsUtil = httpsUtil;
	return obj;
}

function parseHosts(config) {
	var rulesPath = config.rules;
	if (rulesPath) {
		try {
			rulesUtil.parseRules(fs.readFileSync(path.resolve(rulesPath), {encoding: 'utf8'}));
		} catch(e) {}
	}
}

process.on('uncaughtException', function(err){
	var stack = util.getErrorStack(err);
	fs.writeFileSync(path.join(process.cwd(), config.name + '.log'), '\r\n' + stack + '\r\n', {flag: 'a'});
	console.error(stack);
	process.exit(1);
});

module.exports = exportInterfaces(proxy);