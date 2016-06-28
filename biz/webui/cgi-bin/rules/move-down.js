var rules = require('../../lib/rules');

module.exports = function(req, res) {
	rules.moveDown(req.body.name);
	res.json({ec: 0, em: 'success'});
};