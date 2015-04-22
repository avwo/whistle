var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	metaUtil.setProperty('theme', req.body.theme);
	res.json({ec: 0, em: 'success'});
};