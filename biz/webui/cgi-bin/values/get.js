var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	res.json({
		fontSize: rulesUtil.getProperty('valuesFontSize'),
		theme: rulesUtil.getProperty('valuesTheme'),
		showLineNumbers: rulesUtil.getProperty('valuesShowLineNumbers'),
		values: rulesUtil.getValue()
	});
};