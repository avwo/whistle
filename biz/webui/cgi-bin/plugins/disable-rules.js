var properties = require('../../lib/properties');
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
	var disabledPluginsRules = properties.get('disabledPluginsRules') || {};
	if (req.body.disabled == 1) {
		disabledPluginsRules[req.body.name] = 1;
	} else {
		delete disabledPluginsRules[req.body.name];
	}
	properties.set('disabledPluginsRules', disabledPluginsRules);
	pluginMgr.updateRules();
	res.json({ec: 0, data: disabledPluginsRules});
};