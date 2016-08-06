var url = require('url');
var util = require('../util');
var pluginMgr = require('../plugins');

module.exports = function(req, res, next) {
	var protocol = req.options && req.options.protocol;
	var plugin = pluginMgr.getPlugin(protocol);
	if (!plugin) {
		return next();
	}
	
	pluginMgr.loadPlugin(plugin, function(err, ports) {
		if (err) {
			res.response(util.wrapGatewayError(err));
			return;
		}
		
		var options = url.parse(req.fullUrl);
		req.headers[pluginMgr.FULL_URL_HEADER] = encodeURIComponent(req.fullUrl);
		if (options.protocol == 'https:') {
			options.protocol = 'http:';
			req.headers[pluginMgr.SSL_FLAG_HEADER] = 'true';
		}
		
		var localHost = req.rules.host;
	    if (localHost) {
	    	req.headers[pluginMgr.LOCAL_HOST_HEADER] = encodeURIComponent(util.removeProtocol(localHost.matcher, true));
	    	if (localHost.port) {
	    		req.headers[pluginMgr.HOST_PORT_HEADER] = localHost.port;
	    	}
	    }
		
		options.host = '127.0.0.1';
		options.port = ports.port;
		options.href = util.changePort(req.fullUrl, ports.port);
		options.localDNS = true;
		var ruleValue = util.getMatcherValue(req.rules.rule);
		if (ruleValue) {
			req.headers[pluginMgr.RULE_VALUE_HEADER] = encodeURIComponent(ruleValue);
		}
		options.isPlugin = true;
		req.request(options);
	});
};