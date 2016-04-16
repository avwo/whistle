var properties = require('../../lib/properties');
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
	
	res.json({
		plugins: pluginMgr.getPlugins(),
		pluginsRules: pluginMgr.getRules(),
		disabledPlugins: properties.get('disabledPlugins') || {},
		disabledPluginsRules: properties.get('disabledPluginsRules') || {}
	});
};