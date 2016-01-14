var util = require('../util');
var plugins = {};

function getErrorResponse(msg, req) {
	var res = util.wrapResponse({
		statusCode: 500,
		body: msg,
		headers: {
		    	'content-type': 'text/html; charset=utf-8'
		    }
	});
	res.realUrl = req.rules.rule.matcher;
	return res;
}

module.exports = function(req, res, next) {
	var protocol = req.options && req.options.protocol;
	if (protocol != 'plugin:') {
		next();
		return;
	}
	
	var plugin = util.removeProtocol(req.rules.rule.matcher, true);
	if (!plugin) {
		res.response(getErrorResponse('plugin path is empty.', req));
		return;
	}
	
	console.log(plugin);
};