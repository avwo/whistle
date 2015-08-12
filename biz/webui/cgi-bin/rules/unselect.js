var rules = require('../../lib/rules');

module.exports = function(req, res) {
	rules.unselect(req.body.name);
	res.json({ec: 0, em: 'success'});
};