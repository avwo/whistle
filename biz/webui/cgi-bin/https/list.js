var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.createHosts(req.body.name, req.body.content);
	res.json({ec: 0, em: 'success', https: rulesUtil.getInterceptRuleList});
};