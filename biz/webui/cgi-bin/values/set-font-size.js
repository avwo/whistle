var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.setProperty('valuesFontSize', req.body.fontSize);
	res.json({ec: 0, em: 'success'});
};