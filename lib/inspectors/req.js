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
	
	if (data.top || data.bottom || data.body) {
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
	
	['reqBody', 'prependReq', 'appendReq'].forEach(function(key) {
		util.getRuleValue(rules[key], function(value) {
			if (value != null) {
				if (key == 'reqBody') {
					result.body = value;
				} else if (key == 'prependReq') {
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
				
				var delayReq = util.getMatcherValue(req.rules.delayReq);
				if (/^\d+$/.test(delayReq)) {
					data.delay = delayReq;
				}
				
				var reqSpeed = util.getMatcherValue(req.rules.reqSpeed);
				if (/^\d+$/.test(reqSpeed)) {
					data.speed = reqSpeed;
				}
				
				handleReq(req, data);
				util.removeUnsupportsHeaders(req.headers);
				util.parseRuleToJson(req.rules.params, function(params) {
					if (params = params && qs.stringify(params)) {
						if (!req.method || /^GET$/i.test(req.method)) {
							var fullUrl = req.fullUrl;
							req.fullUrl = fullUrl.replace(/\?.*$/, '') + '?' 
											+ util.replaceQueryString(util.getQueryString(fullUrl), params);
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
								}
								
								callback(null, chunk);
							};
							req.add(transform);
						}
					}
					next();
				});
			});
		});
	});
};