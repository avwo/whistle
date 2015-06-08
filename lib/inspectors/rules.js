var url = require('url');
var rules = require('../rules');
var util = require('../../util');

module.exports = function(req, res, next) {
	var config = this.config;
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	var rule = req.rules.rule;
	var proxy = req.rules.proxy;
	req._fromProxy = req.headers[util.PROXY_ID] == config.name;
	var matchedUrl = proxy && !req._fromProxy ? util.rule.getMatcher(proxy) : 
		(util.rule.getUrl(rule) || fullUrl);
	var options = url.parse(matchedUrl);
	if (options.protocol == 'proxy:') {
		var port = options.port || config.port;
		options = url.parse(fullUrl);
		options.port = port;
		options.proxy = proxy;
		matchedUrl = options.protocol + util.removeProtocol(matchedUrl);
	}
	
	options.rule = rule;
	req.options = options;
	req.matchedUrl = matchedUrl;
	next();
};