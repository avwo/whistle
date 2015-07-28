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
	if (!data) {
		return;
	}
	data.headers = util.lowerCaseify(data.headers);
	req.method = data.method || req.method;
	req.timeout = parseInt(data.timeout, 10);
	extend(req.headers, data.headers);
	
	if (data.top || data.bottom || data.body) {
		delete req.headers['content-length'];
	}
	req.add(new WhistleTransform(data));
}

module.exports = function(req, res, next) {
	util.parseRuleToJson(req.rules.req, 
			function(err, data) {
		if (req.rules.head && req.rules.head.req) {
			data = extend(req.rules.head.req, data);
		}
		
		util.readInjectFiles(data, function(data) {
			handleReq(req, data);
			next();
		});
	});
};