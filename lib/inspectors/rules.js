var url = require('url');
var rules = require('../rules');
var util = require('../util');

module.exports = function(req, res, next) {
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	util.parseRuleJson(req.rules.urlParams, function(urlParams) {
		if (urlParams) {
			req.url = util.replaceUrlQueryString(req.url, urlParams);
			fullUrl = req.fullUrl = util.getFullUrl(req);
			req.rules = rules.resolveRules(fullUrl);
		}
		
		req.filter = rules.resolveFilter(fullUrl);
		var rule = req.rules.rule;
		var options = url.parse(util.rule.getUrl(rule) || fullUrl);
		options.rule = rule;
		req.options = options;
		next();
	});
};