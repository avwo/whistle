var rules = require('../../lib/rules');

module.exports = function(req, res) {
	res.json({
		defaultRulesIsDisabled: rules.defaultRulesIsDisabled(),
		defaultRules: rules.getDefault(),
		list: rules.list()
	});
};