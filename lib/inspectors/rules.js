var url = require('url');
var rules = require('../rules');
var util = require('../../util');

module.exports = function(req, res, next) {
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	var rule = req.rules.rule;
	var matchedUrl = rule && rule.url ||fullUrl;
	var options = req.options = url.parse(matchedUrl);
	if (options.protocol == 'proxy:') {
		options.protocol = util.getProtocol(fullUrl);
		options.hostname = null;
		matchedUrl = options.protocol + util.removeProtocol(matchedUrl);
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