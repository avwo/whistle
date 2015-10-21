var qs = require('querystring');
var iconv = require('iconv-lite');
var vm = require('vm');
var util = require('../util');
var extend = require('util')._extend;
var Transform = require('pipestream').Transform;
var WhistleTransform = util.WhistleTransform;
var MAX_REQ_SIZE = 256 * 1024;
var REQ_TYPE = {
		urlencoded: 'application/x-www-form-urlencoded',
		form: 'application/x-www-form-urlencoded',
		json: 'application/json',
		xml: 'text/xml', 
		text: 'text/plain',
		upload: 'multipart/form-data',
		multipart: 'multipart/form-data',
		defaultType: 'application/octet-stream'
};

/**
 * 处理请求数据
 * 
 * @param req：method、body、headers，top，bottom，speed、delay，charset,timeout
 * @param data
 */
function handleReq(req, data) {
	req.method = data.method || req.method;
	req.timeout = parseInt(data.timeout, 10);
	extend(req.headers, data.headers);
	var method = req.method = typeof req.method != 'string' ? 'GET' : req.method.toUpperCase();
	if (!util.hasRequestBody(method)) {
		delete data.top;
		delete data.bottom;
		delete data.body;
	} else if (data.top || data.bottom || data.body) {
		delete req.headers['content-length'];
	}
	
	!util.isEmptyObject(data) && req.add(new WhistleTransform(data));
}

function handleCors(data, cors) {
	if (!cors) {
		return;
	}

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

function handleAuth(data, auth) {
	if (!auth) {
		return;
	}

	var basic = [];
	auth.username != null && basic.push(auth.username);
	auth.password != null && basic.push(auth.password);
	if (basic = basic.join(':')) {
		util.setHeader(data, 'authorization', 'Basic ' + new Buffer(basic).toString('base64'));
	}
}

function handleCookies(data, cookies, curCookies) {
	var list = cookies && Object.keys(cookies);
	if (list && list.length) {
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
}

function handleParams(req, params) {
	if (!(params = params && qs.stringify(params))) {
		return;
	}

	if (!req.method || /^GET$/i.test(req.method)) {
		req.options.search = util.replaceUrlQueryString(req.options.search, params);
		req.options.path = util.replaceUrlQueryString(req.options.path, params);
		req.options.href = util.replaceUrlQueryString(req.options.href, params);
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

module.exports = function(req, res, next) {
	var reqRules = req.rules;
	util.parseRuleJson([reqRules.req, reqRules.reqHeaders, reqRules.reqCookies, 
	                    reqRules.auth, reqRules.params, reqRules.reqCors], 
			function(data, headers, cookies, auth, params, cors) {
		if (reqRules.head && reqRules.head.req) {
			data = extend(reqRules.head.req, data);
		}
		data = data || {};
		if (headers) {
			data.headers =  extend(data.headers || {}, headers);
		}
		
		if (data.headers) {
			data.headers = util.lowerCaseify(data.headers);
		}
		
		var method = util.getMatcherValue(reqRules.method);
		if (method) {
			data.method = method;
		}
		
		var type = util.getMatcherValue(reqRules.reqType);
		if (type) {
			type = type.indexOf('/') != -1 ? type : (REQ_TYPE[type] || REQ_TYPE.defaultType);
			util.setHeader(data, 'content-type', type);
		}
		
		var referer = util.getMatcherValue(reqRules.referer);
		if (referer) {
			util.setHeader(data, 'referer', referer);
		}
		
		var ua = util.getMatcherValue(reqRules.ua);
		if (ua) {
			util.setHeader(data, 'user-agent', ua);
		}
		
		var reqDelay = util.getMatcherValue(reqRules.reqDelay);
		reqDelay = reqDelay && parseInt(reqDelay, 10);
		if (reqDelay > 0) {
			data.delay = reqDelay;
		}
		
		var reqSpeed = util.getMatcherValue(reqRules.reqSpeed);
		reqSpeed = reqSpeed && parseFloat(reqSpeed);
		if (reqSpeed > 0) {
			data.speed = reqSpeed;
		}

		handleCookies(data, cookies, req.headers.cookie);
		handleAuth(data, auth);
		handleCors(data, cors);
		
		util.readInjectFiles(data, function(data) {
			util.getRuleValue([reqRules.reqBody, reqRules.reqPrepend, reqRules.reqAppend], 
				function(reqBody, reqPrepend, reqAppend) {
					if (reqBody) {
						data.body = reqBody;
					}
					
					if (reqPrepend) {
						data.top = reqPrepend;
					}
					
					if (reqAppend) {
						data.append = reqAppend;
					}
					
					handleReq(req, data);
					handleParams(req, params);
					util.removeUnsupportsHeaders(req.headers);
					
					next();
				});
		});
	});
};