var url = require('url');
var rules = require('../rules');
var util = require('../../util');
var config = util.config;

module.exports = function(req, res, next) {
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	var rule = req.rules.rule;
	var proxy = req.rules.proxy;
	req._fromProxy = req.headers[util.PROXY_ID] == config.name;
	var matchedUrl = proxy && !req._fromProxy ? util.rule.getMatcher(proxy) : 
		(util.rule.getUrl(rule) ||fullUrl);
	var options = req.options = url.parse(matchedUrl);
	if (options.protocol == 'proxy:') {
		var opts = url.parse(fullUrl);
		opts.port = options.port || config.port;
		opts.proxy = proxy;
		options = req.options = opts;
		matchedUrl = opts.protocol + util.removeProtocol(matchedUrl);
	}
	
	options.rule = rule;
	rules.resolveHost(matchedUrl, function(err, ip) {
		if (err) {
			req.emit('error', err);
			return;
		}
		options.host = ip;
		next();
	});
};