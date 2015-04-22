var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.setProperty('showLineNumbers', req.body.showLineNumbers == 1);
	res.json({ec: 0, em: 'success'});
};