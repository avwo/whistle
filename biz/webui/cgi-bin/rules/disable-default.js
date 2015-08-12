var rules = require('../../lib/rules');

module.exports = function(req, res) {
	rules.disableDefault();
	res.json({ec: 0, em: 'success'});
};