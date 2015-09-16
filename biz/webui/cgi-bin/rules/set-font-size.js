var properties = require('../../lib/properties');

module.exports = function(req, res) {
	properties.set('fontSize', req.body.fontSize);
	res.json({ec: 0, em: 'success'});
};
