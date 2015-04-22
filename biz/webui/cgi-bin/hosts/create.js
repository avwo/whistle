var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	metaUtil.createHosts(req.body.name, req.body.content);
	res.json({ec: 0, em: 'success'});
};