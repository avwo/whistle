var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.setPublicHosts(req.body.content);
	res.json({ec: 0, em: 'success'});
};