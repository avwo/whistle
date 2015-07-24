var url = require('url');
var rules = require('../rules');
var util = require('../util');

module.exports = function(req, res, next) {
	var config = this.config;
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	var rule = req.rules.rule;
	var proxy = req.rules.proxy;
	var matchedUrl = proxy ? util.rule.getMatcher(proxy) : 
		(util.rule.getUrl(rule) || fullUrl);
	var options = url.parse(matchedUrl);
	if (proxy) {
		var port = options.port || config.port;
		var socks = options.protocol == 'socks:';
		options = url.parse(fullUrl);
		options.port = port;
		options.proxy = proxy;
		options.proxyUrl = matchedUrl = options.protocol + util.removeProtocol(matchedUrl);
		options.socks = socks;
	}
	
	options.rule = rule;
	req.options = options;
	req.matchedUrl = matchedUrl;
	next();
};