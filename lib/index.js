var express = require('express');
var url = require('url');
var net = require('net');
var path = require('path');
var tls = require('tls');
var fs = require('fs');
var socks = require('socksv5');
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
var WHISTLE_POLICY_HEADER = 'x-whistle-policy';
var LOCAL_URL_RE = new RegExp(config.localUIHost.replace(/\./g, '\\.') + '$', 'i');
var index = 0;


function tunnelProxy(server, proxy) {
	//see: https://github.com/joyent/node/issues/9272
	if (typeof tls.checkServerIdentity == 'function') {
		var checkServerIdentity = tls.checkServerIdentity;
		tls.checkServerIdentity = function() {
			try {
				return checkServerIdentity.apply(this, arguments);
			} catch(err) {
				logger.error(err);
				return err;
			}
		};
	}
	
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
	server.on('connect', function(req, reqSocket, head) {//ws, wss, https proxy
		var tunnelUrl = req.fullUrl = util.setProtocol(/^[^:\/]+:\d+$/.test(req.url) ? req.url : req.headers.host, true);
		var options = parseUrl();
		var tunnelUrl = req.fullUrl = 'tunnel://' + options.host;
		var resSocket, proxySocket, responsed;
		req.isTunnel = true;
		var hostname = options.hostname;
		var _rules = req.rules = rules.resolveRules(tunnelUrl);
		var filter = rules.resolveFilter(tunnelUrl);
		var disable = rules.resolveDisable(tunnelUrl);
		var plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
		var rulesMgr = plugin && plugin.rulesMgr;
		util.handlePluginRules(req, rulesMgr);
		if (rulesMgr && !filter.rule) {
			extend(_rules, rulesMgr.resolveRules(req.fullUrl));
		}
		
		var useTunnelPolicy = req.headers[WHISTLE_POLICY_HEADER] == 'tunnel';
		if (!useTunnelPolicy && (LOCAL_URL_RE.test(hostname) || ((filter.https || filter.tunnel
				|| rulesUtil.properties.get('interceptHttpsConnects')) && !filter.intercept && !disable.intercept))) {
			dispatch(reqSocket, hostname, proxy);
			sendEstablished();
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
		req.clientIp = reqData.ip;
		abortIfUnavailable(reqSocket);
		if (!rulesUtil.properties.get('hideHttpsConnects') && !filter.hide) {
			proxy.emit('request', reqEmitter);
		} 
		
		if (disable.tunnel) {
			return reqSocket.destroy();
		}
		
		req.reqId = ++index;
		plugin = pluginMgr.resolvePluginRule(req);
		pluginMgr.getTunnelRules(req, function(_rulesMgr) {
			if (_rulesMgr) {
				rulesMgr = _rulesMgr;
				var pluginRules = rulesMgr.resolveRules(tunnelUrl);
				var _disable = rulesMgr.resolveDisable(tunnelUrl);
				if (pluginRules.rule) {
					_rules.rule = pluginRules.rule;
					plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(_rules.rule));
				}
				if (!disable.tunnel && _disable.tunnel) {
					_rules.disable = pluginRules.disable;
					return reqSocket.destroy();
				}
				if (pluginRules.host) {
          _rules.host = pluginRules.host;
        }
				var _filter = rulesMgr.resolveFilter(tunnelUrl);
				if (!filter.rule && _filter.rule) {
				  _rules.filter = pluginRules.filter;
				  filter.rule = true;
				}
			}
			
			rules.findProxyFromPac(req, function() {
			  var tunnelPort;
	      var proxyUrl = util.rule.getProxy(_rules.rule);
	      if (filter.rule) {
	        delete _rules.rule;
	        plugin = null;
	      } else if(!proxyUrl && plugin) {
	        tunnelPort = plugin.ports && plugin.ports.tunnelPort;
	        if (!tunnelPort) {
	          return emitError(new Error('No plugin.tunnelServer'));
	        }
	        proxyUrl = 'proxy://127.0.0.1:' + tunnelPort;
	      }
	      
	      if (!tunnelPort) {
	        delete headers[pluginMgr.CLIENT_IP_HEADER];
	        delete headers[pluginMgr.RULE_VALUE_HEADER];
	        delete headers[pluginMgr.REQ_ID_HEADER];
	        delete headers[pluginMgr.CUR_RULE_HEADER];
	        delete headers[pluginMgr.LOCAL_HOST_HEADER];
	        delete headers[pluginMgr.HOST_PORT_HEADER];
	      }
	      if (proxyUrl) {
	        var isSocks = /^socks:\/\//.test(proxyUrl);
	        data.realUrl = proxyUrl;
	        var _url = 'https:' + util.removeProtocol(proxyUrl);
	        data.proxy = true;
	        resolveHost(_url, function(ip) {
	          options = parseUrl(_url, isSocks ? 1080 : 8888);
	          if (options.port == config.port && util.isLocalAddress(ip)) {
	            return emitError(new Error('Can not proxy to itself'));
	          }
	          var opts = url.parse(tunnelUrl);
	          headers.host = opts.hostname + ':' + (opts.port || 443);
	          var onConnect = function(_proxySocket) {
	            proxySocket = _proxySocket;
	            abortIfUnavailable(proxySocket);
	            reqSocket.pipe(proxySocket).pipe(reqSocket);
	            sendEstablished();
	          };
	          var dstOptions = url.parse(tunnelUrl);
	          dstOptions.proxyHost = ip;
	          dstOptions.proxyPort = parseInt(options.port, 10);
	          dstOptions.port = dstOptions.port || 443;
	          dstOptions.host = dstOptions.hostname;
	          dstOptions.headers = headers;
	          if (isSocks) {
	            dstOptions.proxyPort = options.port || 1080;
	            dstOptions.localDNS = false;
	            dstOptions.auths = config.getAuths(options);
	            socks.connect(dstOptions, onConnect).on('error', emitError);
	          } else {
	            dstOptions.proxyPort = options.port || 80;
	            dstOptions.proxyAuth = options.auth;
	            config.connect(dstOptions, onConnect).on('error', emitError);
	         }
	        });
	      } else {
	        tunnel();
	      }
			});
		});
		
		function tunnel() {
			resolveHost(tunnelUrl, function(ip, port) {
				resData.ip = port ? ip + ':' + port : ip;
				resSocket = net.connect(port || options.port, ip, function() {
				  resSocket.pipe(reqSocket).pipe(resSocket);
				  sendEstablished();
		    });
				abortIfUnavailable(resSocket);
			});
		}
		
		function parseUrl(_url, port) {
			_url = _url || tunnelUrl;
			options = req.options = url.parse(_url);
			options.port = options.port || port || 443;
			return options;
		}
		
		function resolveHost(url, callback) {
			rules.resolveHost(url, function(err, ip, port, host) {
				if (host) {
					_rules.host = host;
				}
				data.requestTime = data.dnsTime = Date.now();
				resData.ip = ip || LOCALHOST;
				reqEmitter.emit('send', data);
				err ? emitError(err) : callback(ip, port);
			}, rulesMgr);
		}
		
		function abortIfUnavailable(socket) {
			socket.on('error', emitError).on('close', emitError);
		}
		
		function sendEstablished() {
			reqSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n');
			responsed = true;
			if (reqEmitter) {
			  data.responseTime = data.endTime = Date.now();
        resData.statusCode = 200;
        reqEmitter.emit('response', data);
        reqEmitter.emit('end', data);
			}
			
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

function proxy(callback) {
	var app = express();
	var server = app.listen(config.port, callback);
	var proxyEvents = new EventEmitter();
	var middlewares = ['./init', 
	               '../biz']
				   .concat(require('./inspectors'))
				   .concat(config.middlewares)
	               .concat(require('./handlers'));
	
	proxyEvents.config = config;
	app.logger = logger;
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
	obj.logger = logger;
	return obj;
}

process.on('uncaughtException', function(err){
	var stack = util.getErrorStack(err);
	fs.writeFileSync(path.join(process.cwd(), config.name + '.log'), '\r\n' + stack + '\r\n', {flag: 'a'});
	console.error(stack);
	process.exit(1);
});

module.exports = exportInterfaces(proxy);