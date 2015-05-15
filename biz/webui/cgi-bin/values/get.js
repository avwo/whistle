var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	res.json(rulesUtil.getValue());
};