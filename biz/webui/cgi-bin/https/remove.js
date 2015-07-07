var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	req.body.domain && typeof req.body.domain == 'string' 
		&& rulesUtil.removeInterceptRule(req.body.domain);
	res.json({ec: 0, em: 'success'});
};