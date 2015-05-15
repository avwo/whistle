var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.removeValue(req.body.key);
	res.json({ec: 0, em: 'success'});
};