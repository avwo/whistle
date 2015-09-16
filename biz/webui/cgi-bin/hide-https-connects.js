var properties = require('../lib/properties');

module.exports = function(req, res) {
	properties.set('hideHttpsConnects', req.body.hideHttpsConnects == 1);
	res.json({ec: 0, em: 'success'});
};
