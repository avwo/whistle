var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	req.body.enable == '1' ? rulesUtil.enablePublicHosts() : rulesUtil.disablePublicHosts();
	res.json({ec: 0, em: 'success'});
};