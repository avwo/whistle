var qs = require('querystring');
var iconv = require('iconv-lite');
var util = require('../util');
var extend = require('util')._extend;
var Transform = require('pipestream').Transform;
var WhistleTransform = util.WhistleTransform;
var MAX_REQ_SIZE = 256 * 1024;
var REQ_TYPE = {
		'urlencoded': 'application/x-www-form-urlencoded',
		'form': 'application/x-www-form-urlencoded',
		'json': 'application/json',
		'text': 'text/plain',
		'upload': 'multipart/form-data',
		'multipart': 'multipart/form-data',
		'default': 'application/octet-stream'
};

/**
 * 处理请求数据
 * 
 * @param req：method、body、headers，top，bottom，speed、delay，charset,timeout
 * @param data
 */
function handleReq(req, data) {
	if (data.headers) {
		data.headers = util.lowerCaseify(data.headers);
	}
	req.method = data.method || req.method;
	req.timeout = parseInt(data.timeout, 10);
	extend(req.headers, data.headers);
	var method = req.method = typeof req.method != 'string' ? 'GET' : req.method.toUpperCase();
	if (method === 'GET' ||
		      method === 'HEAD' ||
		      method === 'DELETE' ||
		      method === 'OPTIONS' ||
		      method === 'CONNECT') {
		delete data.top;
		delete data.bottom;
		delete data.body;
	} else if (data.top || data.bottom || data.body) {
		delete req.headers['content-length'];
	}
	
	!util.isEmptyObject(data) && req.add(new WhistleTransform(data));
}

function readReqRules(rules, callback) {
	var count = 4;
	var result = {};
	function handleCallback() {
		--count <= 0 && callback(result);
	}
	
	util.parseRuleToJson(rules.reqHeaders, function(headers) {
		if (headers) {
			result.headers = headers;
		}
		handleCallback();
	});
	
	['reqBody', 'reqPrepend', 'reqAppend'].forEach(function(key) {
		util.getRuleValue(rules[key], function(value) {
			if (value != null) {
				if (key == 'reqBody') {
					result.body = value;
				} else if (key == 'reqPrepend') {
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
	var rules = req.rules;
	util.parseRuleToJson(rules.req, 
			function(data) {
		if (rules.head && rules.head.req) {
			data = extend(rules.head.req, data);
		}
		
		util.readInjectFiles(data, function(data) {
			readReqRules(rules, function(result) {
				data = extend(data || {}, result);
				var method = util.getMatcherValue(req.rules.method);
				if (method) {
					data.method = method;
				}
				
				var type = util.getMatcherValue(req.rules.reqType);
				if (type) {
					type = type.indexOf('/') != -1 ? type : (REQ_TYPE[type] || REQ_TYPE['default']);
					util.setHeader(data, 'content-type', type);
				}
				
				var referer = util.getMatcherValue(req.rules.referer);
				if (referer) {
					util.setHeader(data, 'referer', referer);
				}
				
				var ua = util.getMatcherValue(req.rules.ua);
				if (ua) {
					util.setHeader(data, 'user-agent', ua);
				}
				
				var reqDelay = util.getMatcherValue(req.rules.reqDelay);
				reqDelay = reqDelay && parseInt(reqDelay, 10);
				if (reqDelay > 0) {
					data.delay = reqDelay;
				}
				
				var reqSpeed = util.getMatcherValue(req.rules.reqSpeed);
				reqSpeed = reqSpeed && parseFloat(reqSpeed);
				if (reqSpeed > 0) {
					data.speed = reqSpeed;
				}
				
				util.parseRuleToJson([req.rules.reqCookies, req.rules.auth, req.rules.urlParams, req.rules.params, req.rules.reqCors], 
						function(cookies, auth, urlParams, params, cors) {
					//merge cookies
					var list = cookies && Object.keys(cookies);
					if (list && list.length) {
						var curCookies = req.headers.cookie;
						var result = {};
						if (curCookies && typeof curCookies == 'string') {
							curCookies.split(/;\s*/g)
									.forEach(function(cookie) {
										var index = cookie.indexOf('=');
										if (index == -1) {
											result[cookie] = null;
										} else {
											result[cookie.substring(0, index)] = cookie.substring(index + 1);
										}
									});
						}
						
						list.forEach(function(name) {
							var value = cookies[name];
							value = value && typeof value == 'object' ? value.value : value;
							result[util.encodeURIComponent(name)] = value ? util.encodeURIComponent(value) : value;
						});
						
						cookies = Object.keys(result).map(function(name) {
							var value = result[name];
							return name + (value == null ? '' : '=' + value);
						}).join('; ');
						util.setHeader(data, 'cookie', cookies);
					}
					
					//auth
					
					if (auth) {
						var basic = [];
						auth.username != null && basic.push(auth.username);
						auth.password != null && basic.push(auth.password);
						if (basic = basic.join(':')) {
							util.setHeader(data, 'authorization', 'Basic ' + new Buffer(basic).toString('base64'));
						}
					}
					
					if (cors) {
						if (cors.origin !== undefined) {
							util.setHeader(data, 'origin', cors.origin);
						}
						
						if (cors.method !== undefined) {
							util.setHeader(data, 'access-control-request-method', cors.method);
						}

						if (cors.headers !== undefined) {
							util.setHeader(data, 'access-control-request-headers', cors.headers);
						}
					}
					
					handleReq(req, data);
					util.removeUnsupportsHeaders(req.headers);
					if (urlParams) {
						req.fullUrl = util.replaceUrlQueryString(req.fullUrl, urlParams);
					}
					//params
					if (params = params && qs.stringify(params)) {
						if (!req.method || /^GET$/i.test(req.method)) {
							req.fullUrl = util.replaceUrlQueryString(req.fullUrl, params);
						} else if (util.isUrlEncoded(req)) {
							delete req.headers['content-length'];
							var transform = new Transform();
							var buffer, interrupt;
							transform._transform = function(chunk, encoding, callback) {
								if (chunk) {
									if (!interrupt) {
										buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
										chunk = null;
										if (buffer.length > MAX_REQ_SIZE) {
											interrupt = true;
											chunk = buffer;
											buffer = null;
										}
									}
								} else if (buffer) {
									var body = buffer + '';
									var isGBK = body.indexOf('�') == -1;
									if (isGBK) {
										body = iconv.decode(buffer, 'GB18030');
										body = util.replaceQueryString(body, params);
										chunk = iconv.encode(body, 'GB18030');
									} else {
										chunk = new Buffer(body);
									}
									buffer = null;
								} else {
									chunk = new Buffer(params);
								}
								
								callback(null, chunk);
							};
							req.add(transform);
						}
					}
					next();
				})
			});
		});
	});
};