var properties = require('../../lib/properties');
var config = require('../../lib/config');
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
	
	res.json({
		version: config.version,
		latestVersion: properties.get('latestVersion'),
		plugins: pluginMgr.getPlugins(),
		pluginsRules: pluginMgr.getRules(),
		disabledPlugins: properties.get('disabledPlugins') || {},
		disabledPluginsRules: properties.get('disabledPluginsRules') || {}
	});
};