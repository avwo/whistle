var url = require('url');
var util = require('../util');
var pluginMgr = require('../plugins');
var plugins = pluginMgr.getPlugins();

pluginMgr.on('update', function(result) {
	Object.keys(result).forEach(function(name) {
		pluginMgr.kill(result[name]);
	});
});
pluginMgr.on('uninstall', function(result) {
	Object.keys(result).forEach(function(name) {
		pluginMgr.kill(result[name]);
	});
});

module.exports = function(req, res, next) {
	var protocol = req.options && req.options.protocol;
	var homePage = pluginMgr.getPluginFromHomePage(req.fullUrl);
	var plugin = homePage || pluginMgr.getPlugin(protocol);
	if (!plugin) {
		return next();
	}
	
	pluginMgr.loadPlugin(plugin, function(err, ports) {
		if (err) {
			res.response(util.wrapGatewayError(err));
			return;
		}
		
		if (homePage && !ports.uiPort) {
			res.response(util.wrapResponse({
				statusCode: 404,
				body: 'Not Found',
				headers: {
				    	'content-type': 'text/html; charset=utf-8'
				    }
			}));
			return;
		}
		
		var options = url.parse(req.fullUrl);
		options.host = '127.0.0.1';
		options.port = homePage ? ports.uiPort : ports.port;
		options.localDNS = true;
		if (!homePage) {
			var ruleValue = util.removeProtocol(req.rules.rule.matcher, true);
			if (ruleValue) {
				req.headers['x-whistle-rule-value'] = encodeURIComponent(ruleValue);
			}
		}
		req.request(options);
	});
};