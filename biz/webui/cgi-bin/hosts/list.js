var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
	var data = rulesUtil.getHostsData();
	data.fontSize = rulesUtil.getProperty('fontSize');
	data.showLineNumbers = rulesUtil.getProperty('showLineNumbers');
	data.theme = rulesUtil.getProperty('theme');
	res.json(data);
};