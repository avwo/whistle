var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.removeHosts(req.body.name);
	res.json({ec: 0, em: 'success'});
};