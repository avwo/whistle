var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	metaUtil.setProperty('showLineNumbers', req.body.showLineNumbers == 1);
	res.json({ec: 0, em: 'success'});
};