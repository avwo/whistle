var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	req.body.enable == '1' ? metaUtil.enablePublicHosts() : metaUtil.disablePublicHosts();
	res.json({ec: 0, em: 'success'});
};