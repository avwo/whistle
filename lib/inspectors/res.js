var https = require('https');
var http = require('http');
var net = require('net');
var url = require('url');
var mime = require('mime');
var extend = require('util')._extend;
var util = require('../util');
var WhistleTransform = util.WhistleTransform;
var SpeedTransform = util.SpeedTransform;
var STATUS_CODE = http.STATUS_CODES || {};
var rules = require('../rules');

function readResRules(rules, callback) {
	var count = 4;
	var result = {};
	function handleCallback() {
		--count <= 0 && callback(result);
	}
	
	util.parseRuleToJson(rules.resHeaders, function(headers) {
		if (headers) {
			result.headers = headers;
		}
		handleCallback();
	});
	
	['resBody', 'resPrepend', 'resAppend'].forEach(function(key) {
		util.getRuleValue(rules[key], function(value) {
			if (value != null) {
				if (key == 'resBody') {
					result.body = value;
				} else if (key == 'resPrepend') {
					result.top = value;
				} else {
					result.bottom = value;
				}
			}
			handleCallback();
		});
	});
}

module.exports = function(req, res, next) {
	var config = this.config;
	var self = this;
	var responsed, newResHeaders;
	
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
		
		var newCookies = newResHeaders && newResHeaders['set-cookie'];
		if (newCookies) {
			var cookies = res.headers['set-cookie'];
			if (Array.isArray(cookies)) {
				var newNameMap = {};
				newCookies.forEach(function(cookie) {
					var index = cookie.indexOf('=');
					var name = index == -1 ? name : cookie.substring(0, index);
					newNameMap[name] = 1;
				});
				cookies.forEach(function(cookie) {
					var index = cookie.indexOf('=');
					var name = index == -1 ? name : cookie.substring(0, index);
					if (!newNameMap[name]) {
						newCookies.push(cookie);
					}
				});
			}
			res.headers['set-cookie'] = newCookies;
			delete newResHeaders['set-cookie'];
		}
		extend(res.headers, newResHeaders);
		if (!res.headers.pragma) {
			delete res.headers.pragma;
		}
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
			readResRules(req.rules, function(result) {
				data = extend(data || {}, result);
				var cache = util.getMatcherValue(req.rules.cache);
				var maxAge = parseInt(cache, 10);
				var noCache = /^(?:no|no-cache|no-store)$/i.test(cache) || maxAge < 0;
				if (maxAge > 0 || noCache) {
					util.setHeaders(data, {
						'cache-control': noCache ? (/^no-store$/i.test(cache) ? 'no-store' : 'no-cache') : 'max-age=' + maxAge,
						'expires': new Date(Date.now() + (noCache ? -60000000 : maxAge)).toGMTString(),
						'pragma': noCache ? 'no-cache' : ''
					});
				}
				
				var type = util.getMatcherValue(req.rules.resType);
				if (type) {
					type = type.indexOf('/') != -1 ? type : mime.lookup(type, type);
					util.setHeader(data, 'content-type', type);
				}
				
				var resDelay = util.getMatcherValue(req.rules.resDelay);
				resDelay = resDelay && parseInt(resDelay, 10);
				if (resDelay > 0) {
					data.delay = resDelay;
				}
				
				var resSpeed = util.getMatcherValue(req.rules.resSpeed);
				resSpeed = resSpeed && parseFloat(resSpeed);
				if (resSpeed > 0) {
					data.speed = resSpeed;
				}
				
				var statusCode = util.getMatcherValue(req.rules.statusCode);
				if (statusCode) {
					data.statusCode = statusCode;
					data.body = data.body || STATUS_CODE[statusCode];
				} else {
					var redirect = util.getMatcherValue(req.rules.redirect);
					if (redirect) {
						data.statusCode = 302;
						util.setHeader(data, 'location', redirect);
					}
				}
				
				util.parseRuleToJson(req.rules.resCookies, 
						function(cookies) {
					var list = cookies && Object.keys(cookies);
					var curCookies = data.headers && data.headers['set-cookie'];
					if (!Array.isArray(curCookies)) {
						curCookies = curCookies ? [curCookies + ''] : [];
					}
					
					if (list && list.length) {
						var result = {};
						curCookies.forEach(function(cookie) {
							var index = cookie.indexOf('=');
							if (index == -1) {
								result[cookie] = null;
							} else {
								result[cookie.substring(0, index)] = cookie.substring(index + 1);
							}
						});
						
						list.forEach(function(name) {
							var cookie = cookies[name];
							name = util.encodeURIComponent(name);
							if (!cookie || typeof cookie != 'object') {
								result[name] = cookie ? util.encodeURIComponent(cookie) : cookie;
							} else {
								var attrs = [];
								var value = cookie.value;
								attrs.push(value ? util.encodeURIComponent(value) : (value == null ? '' : value));
								var maxAge = cookie.maxAge && parseInt(cookie.maxAge, 10);
								if (Number.isInteger(maxAge)) {
									attrs.push('Expires=' + new Date(Date.now() + maxAge * 1000).toGMTString());
									attrs.push('Max-Age=' + maxAge);
								}
								cookie.secure && attrs.push('Secure');
								cookie.path && attrs.push('Path=' + cookie.path);
								cookie.domain && attrs.push('Domain=' + cookie.domain);
								cookie.httpOnly && attrs.push('HttpOnly');
								result[name] = attrs.join('; ');
							}
						});
						
						
						cookies = Object.keys(result).map(function(name) {
							var value = result[name];
							return name + (value == null ? '' : '=' + value);
						});
						util.setHeader(data, 'set-cookie', cookies);
					}
					
					if (data.headers) {
						data.headers = newResHeaders = util.lowerCaseify(data.headers);
					}
					
					if (data.statusCode) {
						req.hostIp = '127.0.0.1';
						util.drain(req, function() {
							res.response(util.wrapResponse(data));
						});
						return;
					}
					
					if (data.speed || data.delay) {
						res.add(new SpeedTransform(data));
					}
					
					delete data.headers;
					delete data.speed;
					delete data.delay;
					
					if (!util.isEmptyObject(data)) {
						res.addZipTransform(new WhistleTransform(data));
					}
					next();
				});
				
			});
		});
	});
};