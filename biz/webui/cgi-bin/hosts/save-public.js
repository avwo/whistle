var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	metaUtil.setPublicHosts(req.body.content);
	res.json({ec: 0, em: 'success'});
};