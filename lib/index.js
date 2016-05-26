var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var tls = require('tls');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var extend = require('util')._extend;
var util = require('./util');
var logger = require('./util/logger');
var rules = require('./rules');
var dispatch = require('./https');
var httpsUtil = require('./https/util');
var rulesUtil = require('./rules/util');
var initDataServer = require('./util/data-server');
var initLogServer = require('./util/log-server');
var pluginMgr = require('./plugins');
var config = require('./config');
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
		var tunnelUrl = req.fullUrl = util.setProtocol(req.url, true);
		var options = parseUrl();
		var resSocket, proxySocket, responsed;
		req.isTunnel = true;
		if (!options.hostname) {
			tunnelUrl = req.fullUrl = util.setProtocol(req.headers.host, true);
			options = parseUrl();
		}
		var hostname = options.hostname;
		abortIfUnavailable(reqSocket);
		var _rules = req.rules = rules.resolveRules(tunnelUrl);
		var filter = rules.resolveFilter(tunnelUrl);
		var disable = rules.resolveDisable(tunnelUrl);
		var plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
		var rulesMgr = plugin && plugin.rulesMgr;
		util.handlePluginRules(req, rulesMgr);
		if (rulesMgr && !filter.rule) {
			extend(_rules, rulesMgr.resolveRules(req.fullUrl));
		}
		
		if (/local\.whistlejs\.com$/.test(hostname) || filter.https 
				|| (rulesUtil.properties.get('interceptHttpsConnects') && (!filter.intercept && !disable.intercept))) {
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
			var _url = _rules.rule && util.setProtocol(util.rule.getMatcher(_rules.rule), true);
			if (/^https:/i.test(_url)) {
				options = parseUrl(_url);
				data.realUrl = _url;
				tunnel(_url);
			} else {
				tunnel();
			}
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
			}, rulesMgr);
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

function proxy() {
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
	
	exportInterfaces(proxyEvents);
	tunnelProxy(server, proxyEvents);
	initDataServer(proxyEvents);
	initLogServer(proxyEvents);
	require('../biz/init')(proxyEvents);
	config.debug && rules.disableDnsCache();
	return proxyEvents;
}

function exportInterfaces(obj) {
	obj.rules = rules;
	obj.util = util;
	obj.rulesUtil = rulesUtil;
	obj.httpsUtil = httpsUtil;
	obj.pluginMgr = pluginMgr;
	return obj;
}

process.on('uncaughtException', function(err){
	var stack = util.getErrorStack(err);
	fs.writeFileSync(path.join(process.cwd(), config.name + '.log'), '\r\n' + stack + '\r\n', {flag: 'a'});
	console.error(stack);
	process.exit(1);
});

module.exports = exportInterfaces(proxy);