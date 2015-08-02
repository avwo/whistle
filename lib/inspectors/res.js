var https = require('https');
var http = require('http');
var net = require('net');
var url = require('url');
var extend = require('util')._extend;
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
		req.realUrl = res.realUrl = options.href;
		
		var now = Date.now();
		var proxyUrl;
		if (util.isProxyProtocol(options.protocol)) {
			proxyUrl = util.rule.getMatcher(req.rules.rule);
			options = url.parse(req.fullUrl);
		}
		
		rules.resolveHost(options.localDNS && net.isIP(options.host) ? options.host : 
			(proxyUrl && util.replaceProtocol(proxyUrl, util.getProtocol(req.fullUrl)) || options.href),
				function(err, ip) {
			req.dnsTime = Date.now() - now;
			req.hostIp = ip;
			
			if (err) {
				util.drain(req, function() {
					  res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + util.getErrorStack(err)));
					});
				return;
			}
			
			var isHttps = options.protocol == 'https:'; 
			var headers = req.headers;
			if (proxyUrl) {
				var proxyOptions = url.parse(proxyUrl);
				proxyOptions.host = ip;
				var isSocks = proxyOptions.protocol == 'socks:';
				if (isSocks || isHttps) {
					util.connect({
						isSocks: isSocks,
						host: ip,
						port: proxyOptions.port,
						isHttps: isHttps,
						url: req.fullUrl,
						auth: proxyOptions.auth,
						headers: {
							host: headers.host,
							'proxy-connection': 'keep-alive',
							'user-agent': headers['user-agent']
						}
					}, function(err, socket) {
						if (err) {
							util.drain(req, function() {
								  res.response(util.wrapGatewayError('Failed to connect to the proxy server: '
										  + proxyUrl + '; IP: ' + ip
										  + ' \r\n' + util.getErrorStack(err)));
								});
							return;
						}
						options.createConnection = function() {
							return socket;
						};
						request(options);
					});
					return;
				}
				
				options.port = proxyOptions.port || config.port; //http proxy
			}
			
			options.host = ip;//设置ip
			if ((options.port || 80) == config.port && util.isLocalAddress(options.host)) {
				util.drain(req, function() {
					res.response(util.wrapResponse({
						statusCode: 302,
						headers: {
							location: 'http://' + config.localUIHost + (options.path || '')
						}
					}));
				});
			} else {
				options.agent = isHttps ? config.httpsAgent : config.httpAgent;
				request(options);
			}
			
			function request(options) {
				options.headers = headers;
				options.method = req.method;
				options.rejectUnauthorized = false;
				if (!proxyUrl) {
					headers.host = options.hostname + (options.port ? ':' + options.port : '');
				}
				headers.Host = headers.host;//tencent的服务器不识别小写的host
				options.hostname = null; //防止自动dns
				var client = (isHttps ? https : http)
											.request(options, res.response)
												.on('error', function(err) {
													util.drain(req, function() {
														res.response(util.wrapGatewayError(util.getErrorStack(err)));
													});
												});
				req.pipe(client);
			
			}
		}, req.filter.host);
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
			function(data) {
		if (req.rules.head && req.rules.head.res) {
			data = extend(req.rules.head.res, data);
		}
		util.readInjectFiles(data, function(data) {
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
	});
};