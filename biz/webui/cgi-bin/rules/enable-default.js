var rules = require('../../lib/rules');

module.exports = function(req, res) {
	rules.enableDefault();
	rules.setDefault(req.body.value);
	res.json({ec: 0, em: 'success'});
};