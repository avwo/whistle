var properties = require('../../lib/properties');

module.exports = function(req, res) {
	properties.set('currentValuesFile', req.body.name);
	res.json({ec: 0, em: 'success'});
};
