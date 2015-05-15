var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.setProperty('valuesTheme', req.body.theme);
	res.json({ec: 0, em: 'success'});
};