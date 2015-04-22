var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	rulesUtil.setProperty('fontSize', req.body.fontSize);
	res.json({ec: 0, em: 'success'});
};