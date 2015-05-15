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
	var options = req.options = url.parse(matchedUrl);
	if (options.protocol == 'proxy:') {
		var opts = url.parse(fullUrl);
		opts.port = options.port || config.port;
		opts.proxy = proxy;
		options = req.options = opts;
		matchedUrl = opts.protocol + util.removeProtocol(matchedUrl);
	}
	
	options.rule = rule;
	var startTime = Date.now();
	rules.resolveHost(matchedUrl, function(err, ip) {
		if (err) {
			util.emitError(req, err);
			return;
		}
		req.dnsTime = Date.now() - startTime;
		options.host = ip;
		next();
	});
};