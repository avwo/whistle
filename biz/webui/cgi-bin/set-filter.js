var rules = require('../lib/rules');

module.exports = function(req, res) {
	rules.setFilter(req.body.filter);
	res.json({ec: 0, em: 'success'});
};