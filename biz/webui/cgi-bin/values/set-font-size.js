var properties = require('../../lib/properties');

module.exports = function(req, res) {
	properties.set('valuesFontSize', req.body.fontSize);
	res.json({ec: 0, em: 'success'});
};