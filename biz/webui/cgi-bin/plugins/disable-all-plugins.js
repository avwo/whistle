var properties = require('../../lib/properties');
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
	var disabledAllPlugins = properties.get('disabledAllPlugins');
	if (req.body.disabled == 1) {
		properties.set('disabledAllPlugins', true);
	} else {
		properties.set('disabledAllPlugins', false);
	}
	//pluginMgr.disable() : pluginMgr.enable();;
	//pluginMgr.updateRules();
	res.json({ec: 0, em: 'success'});
};