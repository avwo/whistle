var util = require('../../util');

module.exports = function(req, res, next) {
	util.parseFileToJson(req.rules.head && req.rules.head.url, 
			function(err, data) {
		if (data) {
			var tmp = req.rules.head.req = {};
			if (data.req) {
				tmp.headers = req;
			}
			
			tmp = req.rules.head.res = {};
			if (data.statusCode) {
				tmp.statusCode = data.statusCode;
			}
			
			if (data.body) {
				tmp.body = tmp.body;
			}
			
			if (data.res) {
				tmp.headers = data.res;
			}
			
		}
		next();
	});
};