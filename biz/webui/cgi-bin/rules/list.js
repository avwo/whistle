var util = require('./util');

module.exports = function(req, res) {
	res.json({
		defaultRulesIsDisabled: util.defaultRulesIsDisabled(),
		defaultRules: util.getDefault(),
		list: util.list()
	});
};