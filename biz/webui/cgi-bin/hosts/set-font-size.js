var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	metaUtil.setProperty('fontSize', req.body.fontSize);
	res.json({ec: 0, em: 'success'});
};