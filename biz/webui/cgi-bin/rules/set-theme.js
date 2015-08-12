var properties = require('../../lib/properties');

module.exports = function(req, res) {
	properties.set('theme', req.body.theme);
	res.json({ec: 0, em: 'success'});
};

