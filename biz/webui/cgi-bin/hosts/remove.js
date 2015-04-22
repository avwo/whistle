var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	metaUtil.removeHosts(req.body.name);
	res.json({ec: 0, em: 'success'});
};