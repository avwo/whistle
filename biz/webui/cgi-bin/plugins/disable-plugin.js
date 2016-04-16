var properties = require('../../lib/properties');
var rules = require('../../lib/rules');

module.exports = function(req, res) {
	var disabledPlugins = properties.get('disabledPlugins') || {};
	if (req.body.disabled) {
		disabledPlugins[req.name] = 1;
	} else {
		delete disabledPlugins[req.name];
	}
	properties.set('disabledPlugins', disabledPlugins);
	res.json({ec: 0, data: disabledPlugins});
};