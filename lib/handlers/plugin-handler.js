var url = require('url');
var util = require('../util');
var pluginMgr = require('../plugins');
var plugins = pluginMgr.getPlugins();

pluginMgr.on('update', function(result) {
	Object.keys(result).forEach(function(name) {
		pluginMgr.stopPlugin(result[name]);
	});
});
pluginMgr.on('uninstall', function(result) {
	Object.keys(result).forEach(function(name) {
		pluginMgr.stopPlugin(result[name]);
	});
});

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
		if (options.protocol == 'https:') {
			options.protocol = 'http:';
			req.headers[pluginMgr.SSL_FLAG_HEADER] = 'true';
		}
		
		options.host = '127.0.0.1';
		options.port = ports.port;
		options.href = util.changePort(req.fullUrl, ports.port);
		options.localDNS = true;
		var ruleValue = util.removeProtocol(req.rules.rule.matcher, true);
		if (ruleValue) {
			req.headers[pluginMgr.RULE_VALUE_HEADER] = encodeURIComponent(ruleValue);
		}
		options.isPlugin = true;
		req.request(options);
	});
};