var qs = require('querystring');
var util = require('../util');
var extend = require('util')._extend;
var WhistleTransform = util.WhistleTransform;

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
				handleReq(req, data);
				util.removeUnsupportsHeaders(req.headers);
				util.parseRuleToJson(req.rules.params, function(params) {
					if (params && (!req.method || /^GET$/i.test(req.method))) {
						if (params = qs.stringify(params)) {
							req.rules.params.query = util.replaceQueryString(util.getQueryString(req.fullUrl), params);
						}
						next();
					} else if (params && util.isUrlEncoded(req)) {
						req.rules.params.body = qs.stringify(params);
						next();
					} else {
						next();
					}
				});
			});
		});
	});
};