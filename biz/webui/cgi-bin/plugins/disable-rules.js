var properties = require('../../lib/properties');
var rules = require('../../lib/rules');

module.exports = function(req, res) {
	var disabledPluginsRules = properties.get('disabledPluginsRules') || {};
	if (req.body.disabled) {
		disabledPluginsRules[req.name] = 1;
	} else {
		delete disabledPluginsRules[req.name];
	}
	properties.set('disabledPluginsRules', disabledPluginsRules);
	res.json({ec: 0, em: 'success'});
};