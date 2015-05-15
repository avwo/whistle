var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.setValue(req.body.key, req.body.value);
	res.json({ec: 0, em: 'success'});
};