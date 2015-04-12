var config = require('../../util').config;
var url = require('url');

module.exports = function(req, res, next) {
	var options = req.options;
	var protocol = options && options.protocol;
	
	if (protocol == 'tianma-debug:' || protocol == 'stianma-debug:') {
		req.headers[config.tianmaDebug] = 'debug';
		protocol = protocol.split('-')[0] + ':';
	}
	
	if (protocol == 'tianma:' || protocol == 'stianma:') {
		req.headers[config.tianmaRoot] = encodeURIComponent(options.rule.matcher.substring(protocol.length + 2));
		req.options = url.parse(req.fullUrl);
		req.options.rule = options.rule;
		options = req.options;
		if (protocol == 'stianma:') {
			options.protocol = 'https:';
			options.port = this.tianmasslport;
		} else {
			options.protocol = 'http:';
			options.port = this.tianmaport;
		}
		options.hosts = [null, '127.0.0.1'];
	}
	next();
};