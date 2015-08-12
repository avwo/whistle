var properties = require('../../lib/properties');

module.exports = function(req, res) {
	properties.set('valuesTheme', req.body.theme);
	res.json({ec: 0, em: 'success'});
};