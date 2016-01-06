var https = require('https');
var http = require('http');
var net = require('net');
var url = require('url');
var mime = require('mime');
var Q = require('q');
var extend = require('util')._extend;
var util = require('../util');
var properties = require('../rules/util').properties;
var WhistleTransform = util.WhistleTransform;
var SpeedTransform = util.SpeedTransform;
var ReplacePatternTransform = util.ReplacePatternTransform;
var ReplaceStringTransform = util.ReplaceStringTransform;
var FileWriterTransform = util.FileWriterTransform;
var rules = require('../rules');



function handleCookies(data, cookies) {
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
}

function handleCors(data, cors) {
	if (!cors) {
		return;
	}

	if (cors.origin !== undefined) {
		util.setHeader(data, 'access-control-allow-origin', cors.origin);
	}
	
	if (cors.methods !== undefined) {
		util.setHeader(data, 'access-control-allow-methods', cors.methods);
	}

	if (cors.headers !== undefined) {
		util.setHeader(data, 'access-control-expose-headers', cors.headers);
	}
	
	if (cors.credentials !== undefined) {
		util.setHeader(data, 'access-control-allow-credentials', cors.credentials);
	}

	if (cors.maxAge !== undefined) {
		util.setHeader(data, 'access-control-max-age', cors.maxAge);
	}
}

function setCookies(headers, data) {
	if (!data.headers) {
		return;
	}
	
	var newCookies = data.headers['set-cookie'];
	if (newCookies) {
		var cookies = headers['set-cookie'];
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
		headers['set-cookie'] = newCookies;
		delete data.headers['set-cookie'];
	}
	extend(headers, data.headers);
}

function removeDisableProps(req, headers) {
	var disable = req.disable;
	
	if (disable.cookie || disable.cookies || 
			disable.resCookie || disable.resCookies) {
		delete headers['set-cookie'];
	}
	
	if (disable.cache) {
		headers['cache-control'] = 'no-cache';
		headers.expires = new Date(Date.now() -60000000).toGMTString();
		headers.pragma = 'no-cache';
	}
	
	if (disable.csp) {
		delete headers['content-security-policy'];
		delete headers['content-security-policy-report-only'];
		delete headers['x-content-security-policy'];
		delete headers['x-content-security-policy-report-only'];
		delete headers['x-webkit-csp'];
	}
}

function handleReplace(res, replacement) {
	if (!replacement) {
		return;
	}
	
	var type = util.getContentType(res.headers);
	if (!type || type == 'IMG') {
		return;
	}
	
	Object.keys(replacement).forEach(function(pattern) {
		var value = replacement[pattern];
		if (util.isOriginalRegExp(pattern) && (pattern = util.toOriginalRegExp(pattern))) {
			res.addTextTransform(new ReplacePatternTransform(pattern, value));
		} else if (pattern) {
			res.addTextTransform(new ReplaceStringTransform(pattern, value));
		}
	});
}

function getWriterFile(file, statusCode) {
	if (!file || statusCode == 200) {
		return file;
	}
	
	return file + '.' + statusCode;
}

module.exports = function(req, res, next) {
	var config = this.config;
	var self = this;
	var responsed;
	var resRules = req.rules;
	
	req.request = function(options) {
		options = options || req.options;
		req.realUrl = res.realUrl = options.href;
		
		var now = Date.now();
		var proxyUrl;
		if (util.isProxyProtocol(options.protocol)) {
			proxyUrl = util.rule.getMatcher(resRules.rule);
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
				options.agent = req.disable.keepAlive ? false : (isHttps ? config.httpsAgent : config.httpAgent);
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
		res.headers = _res.headers;
		res.trailers = _res.trailers;
		res.statusCode = _res.statusCode = _res.statusCode || 0;
		if (req.disable['301'] && _res.statusCode == 301) {
			_res.statusCode = 302;
		}
		
		util.getFileWriters([util.hasBody(_res) ? getWriterFile(util.getRuleFile(resRules.resWrite), _res.statusCode) : null, 
				getWriterFile(util.getRuleFile(resRules.resWriteRaw), _res.statusCode)], function(writer, rawWriter) {
				res.on('src', function(_res) {
					if (writer) {
						res.addZipTransform(new FileWriterTransform(writer, _res));
					}
					
					if (rawWriter) {
						res.addZipTransform(new FileWriterTransform(rawWriter, _res, true, req));
					}
				});
			
			res.src(_res);
			removeDisableProps(req, _res.headers);
			if (properties.get('showHostIpInResHeaders')) {
				_res.headers['x-host-ip'] = req.hostIp || LOCALHOST;
			}
			res.writeHead(_res.statusCode, _res.headers);
			res.trailers && res.addTrailers(res.trailers);
		}); 
		
	};
	
	var cors = resRules.resCors;
	var resCors = util.getMatcherValue(cors);
	if (resCors == 'use-credentials') {
		cors = null;
		resCors = 'enable';
	} else if (resCors == '*' || resCors == 'enable') {
		cors = null;
	} else {
		resCors = null;
	}
	
	util.parseRuleJson([resRules.res, resRules.resHeaders, resRules.resCookies, cors, resRules.resReplace], 
			function(data, headers, cookies, cors, replacement) {
		if (resRules.head && resRules.head.res) {
			data = extend(resRules.head.res, data);
		}
		
		data = data || {};
		
		if (headers) {
			data.headers = extend(data.headers || {}, headers)
		}
		
		if (data.headers) {
			data.headers = util.lowerCaseify(data.headers);
		}
		
		handleCookies(data, cookies);
		
		if (resCors == '*') {
			util.setHeader(data, 'access-control-allow-origin', '*');
		} else if (resCors == 'enable') {
			var origin = req.headers.origin;
			util.setHeaders(data, {
				'access-control-allow-credentials': !!origin,
				'access-control-allow-origin': origin || '*'
			});
		} else {
			handleCors(data, cors);
		}
		
		var cache = util.getMatcherValue(resRules.cache);
		var maxAge = parseInt(cache, 10);
		var noCache = /^(?:no|no-cache|no-store)$/i.test(cache) || maxAge < 0;
		if (maxAge > 0 || noCache) {
			util.setHeaders(data, {
				'cache-control': noCache ? (/^no-store$/i.test(cache) ? 'no-store' : 'no-cache') : 'max-age=' + maxAge,
				'expires': new Date(Date.now() + (noCache ? -60000000 : maxAge)).toGMTString(),
				'pragma': noCache ? 'no-cache' : ''
			});
		}
		
		var type = util.getMatcherValue(resRules.resType);
		if (type) {
			type = type.indexOf('/') != -1 ? type : mime.lookup(type, type);
			util.setHeader(data, 'content-type', type);
		}
		
		var resDelay = util.getMatcherValue(resRules.resDelay);
		resDelay = resDelay && parseInt(resDelay, 10);
		if (resDelay > 0) {
			data.delay = resDelay;
		}
		
		var resSpeed = util.getMatcherValue(resRules.resSpeed);
		resSpeed = resSpeed && parseFloat(resSpeed);
		if (resSpeed > 0) {
			data.speed = resSpeed;
		}
		
		var statusCode = util.getMatcherValue(resRules.statusCode);
		if (statusCode) {
			data.statusCode = statusCode;
		} else {
			var redirect = util.getMatcherValue(resRules.redirect);
			if (redirect) {
				data.statusCode = 302;
				util.setHeader(data, 'location', redirect);
			}
		}
		
		util.readInjectFiles(data, function(data) {
			util.getRuleValue([resRules.resBody, resRules.resPrepend, resRules.resAppend, resRules.html, resRules.js, resRules.css], 
					function(resBody, resPrepend, resAppend, html, js, css) {
						if (resBody) {
							data.body = resBody;
						}
						
						if (resPrepend) {
							data.top = resPrepend;
						}
						
						if (resAppend) {
							data.append = resAppend;
						}
						
						res.on('src', function(_res) {
							
							var headers = _res.headers;
							setCookies(headers, data);
							if (!headers.pragma) {
								delete headers.pragma;
							}
							
							if (headers.location) {
								//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
								headers.location = util.encodeNonAsciiChar(headers.location);
							}
							
							var speedTransform = data.speed || data.delay ? new SpeedTransform(data) : null;
							delete data.headers;
							delete data.speed;
							delete data.delay;
							
							var type = util.getContentType(headers);
							var bottom = data.bottom || '';
							switch(type) {
								case 'HTML':
									bottom += (css ? '<style>' + css + '</style>' : '') 
												+ (html || '') + (js ? '<script>' + js + '</script>' : '');
									break;
								case 'JS':
									bottom +=  js || '';
									break;
								case 'CSS':
									bottom +=  css || '';
									break;
							}
							
							if (bottom) {
								data.bottom = bottom;
							}
							
							if (!util.isEmptyObject(data)) {
								res.addZipTransform(new WhistleTransform(data));
							}
							
							if (util.hasBody(_res)) {
								handleReplace(res, replacement);
							}
							
							//一定放在最后，确保能过滤到动态注入的内容
							if (speedTransform) {
								res.add(speedTransform);
							}
						});
						
						if (data.statusCode) {
							req.hostIp = '127.0.0.1';
							util.drain(req, function() {
								res.response(util.wrapResponse(data));
							});
							return;
						}

						next();
				});
		});
	});
};