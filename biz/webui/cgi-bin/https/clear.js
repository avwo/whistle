var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.clearInterceptRules();
	res.json({ec: 0, em: 'success'});
};