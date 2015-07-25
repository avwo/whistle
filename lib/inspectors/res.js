var https = require('https');
var http = require('http');
var net = require('net');
var url = require('url');
var tls = require('tls');
var extend = require('util')._extend;
var socks = require('socksv5');
var util = require('../util');
var WhistleTransform = util.WhistleTransform;
var rules = require('../rules');

function addRuleHeaders(headers, req, name) {
	name = 'x-' + name + '-';
	var rules = req.rules;
	for (var i in rules) {
		headers[name + i] = rules[i].matcher;
	}
	headers['x-remote-ip'] = req.hostIp || '127.0.0.1';
	return headers;
}

function handleRes(res, data) {
	if (data) {
		extend(res.headers, data.headers);
		res.addZipTransform(new WhistleTransform(data));
	}
	
}

module.exports = function(req, res, next) {
	var config = this.config;
	var self = this;
	var responsed, resData;
	
	req.request = function(options) {
		options = options || req.options;
		var now = Date.now();
		rules.resolveHost(net.isIP(options.host) ? options.host : (options.proxyUrl || options.href),
				function(err, ip, customHost) {
			req.dnsTime = Date.now() - now;
			req.customHost = customHost;
			req.hostIp = ip;
			options.host = ip;
			req.realUrl = res.realUrl = options.href;
			
			if (err) {
				util.drain(req, function() {
					  res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + util.getErrorStack(err)));
					});
				return;
			}
			
			var isHttps = options.protocol == 'https:'; 
			var headers = req.headers;
			if (options.proxy) {
				if (/^socks:/.test(options.proxy.matcher)) {
					//console.log(util.getAuths(options.proxyUrl));
					return;
				}
				
				if (isHttps) {
					util.connect({
						host: options.host,
						port: options.port,
						headers: {
							host: headers.host,
							'proxy-connection': 'keep-alive',
							'user-agent': headers['user-agent']
						}
					}, function(err, socket) {
						
						if (err) {
							util.drain(req, function() {
								  res.response(util.wrapGatewayError('Could not connect to the proxy server: '
										  + options.host + ':' + (options.port || config.port)
										  + ' \r\n' + util.getErrorStack(err)));
								});
							return;
						}
						
						options = url.parse(req.fullUrl);
						options.agent = new https.Agent({
							createConnection: function() {
								return tls.connect({
							        rejectUnauthorized: false,
							        socket: socket
							    }).on('error', util.noop);
							}
						});
						request(options);
					});
					
					return;
				}
			}
			
			if (util.isLocalAddress(options.host) && (options.port || 80) == config.port) {
				util.drain(req, function() {
					res.response(util.wrapResponse({
						statusCode: 302,
						headers: {
							location: 'http://' + config.localUIHost + (options.path || '')
						}
					}));
				});
				return;
			}
			
			options.agent = isHttps ? config.httpsAgent : config.httpAgent;
			request(options);
			
			function request(options) {
				options.headers = headers;
				options.method = req.method;
				options.hostname = null;
				options.rejectUnauthorized = false;
				if (!options.proxy) {
					headers.host = options.hostname + (options.port ? ':' + options.port : '');
				}
				headers.Host = headers.host;//tencent的服务器不识别小写的host
				var client = (isHttps ? https : http).request(options, res.response);
				
				client.on('error', function(err) {
					util.drain(req, function() {
						res.response(util.wrapGatewayError(util.getErrorStack(err)));
					});
				});
				req.pipe(client);
			}
		});
	};
	
	res.response = function(_res) {
		if (responsed) {
			return;
		}
		responsed = true;
		if (_res.realUrl) {
			req.realUrl = res.realUrl = _res.realUrl;
		}
		var headers = res.headers = _res.headers;
		res.trailers = _res.trailers;
		res.statusCode = _res.statusCode = _res.statusCode || 0;
		handleRes(res, resData);
		addRuleHeaders(headers, req, config.name);
		if (headers.location) {
			//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
			headers.location = util.encodeNonAsciiChar(headers.location);
		}
		res.src(_res);
		res.writeHead(_res.statusCode, _res.headers);
		res.trailers && res.addTrailers(res.trailers);
	};
	
	util.parseRuleToJson(req.rules.res, 
			function(err, data) {
		if (req.rules.head && req.rules.head.res) {
			data = extend(req.rules.head.res, data);
		}
		
		if (resData = data) {
			data.headers = util.lowerCaseify(data.headers);
			if (data.statusCode) {
				req.hostIp = '127.0.0.1';
				util.drain(req, function() {
					res.response(util.wrapResponse(data));
				});
				return;
			}
			
			if (data.top || data.bottom || data.body) {
				util.removeUnsupportsHeaders(req.headers);
			}
		}
		
		next();
	});
};