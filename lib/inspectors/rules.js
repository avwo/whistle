var url = require('url');
var rules = require('../rules');
var util = require('../util');

module.exports = function(req, res, next) {
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	var rule = req.rules.rule;
	var proxy = req.rules.proxy;
	var options;
	
	if (proxy) {
		options = url.parse(util.rule.getMatcher(proxy));
		var port = options.port || this.config.port;
		options = url.parse(fullUrl);
		options.port = port;
		options.proxy = proxy;
	} else {
		options = url.parse(util.rule.getUrl(rule) || fullUrl);
	}
	
	options.rule = rule;
	req.options = options;
	next();
};