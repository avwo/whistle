var util = require('../../util');

module.exports = function(req, res, next) {
	var head = req.rules.head;
	if (!head) {
		next();
		return;
	}
	
	if (head.value) {
		handleHead(null, util.parseJSON(util.removeProtocol(head.value, true)));
		return;
	}
	
	util.parseFileToJson(head && (head.path || head.url), handleHead);
	
	function handleHead(err, data) {
		if (data) {
			var reqRule = req.rules.head.req = {};
			if (data.req) {
				reqRule.headers = req;
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
	}
};