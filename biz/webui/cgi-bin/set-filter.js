var rulesUtil = require('../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.setFilter(req.body.filter);
	res.json({ec: 0, em: 'success'});
};