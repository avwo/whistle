var util = require('../../util');

module.exports = function(req, res, next) {
	util.parseRuleToJson(req.rules.head, function (err, data) {
		if (data) {
			var reqRule = req.rules.head.req = {};
			if (data.req) {
				reqRule.headers = data.req;
			}
			
			var resRule = req.rules.head.res = {};
			if (data.statusCode) {
				resRule.statusCode = data.statusCode;
			}
			
			if (data.body) {
				resRule.body = data.body;
			}
			
			if (data.res) {
				resRule.headers = data.res;
			}
			
		}
		
		next();
	});
};