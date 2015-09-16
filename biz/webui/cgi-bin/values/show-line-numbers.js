var properties = require('../../lib/properties');

module.exports = function(req, res) {
	properties.set('valuesShowLineNumbers', req.body.showLineNumbers == 1);
	res.json({ec: 0, em: 'success'});
};