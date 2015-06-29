var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.disableHosts();
	res.json({ec: 0, em: 'success'});
};