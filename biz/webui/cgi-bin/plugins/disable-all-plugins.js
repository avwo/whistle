var properties = require('../../lib/properties');
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
	properties.set('disabledAllPlugins', req.body.disabledAllPlugins == 1);
	res.json({ec: 0, em: 'success'});
};