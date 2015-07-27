var rulesUtil = require('../lib/rules-util');
var util = require('./util');
var config = require('../lib/config');

module.exports = function(req, res) {
	var data = rulesUtil.getHostsData();
	data.fontSize = rulesUtil.getProperty('fontSize');
	data.showLineNumbers = rulesUtil.getProperty('showLineNumbers');
	data.theme = rulesUtil.getProperty('theme');
	data.version = config.version;
	
	res.json({
		rules: data,
		server: util.getServerInfo(),
		values: {
			fontSize: rulesUtil.getProperty('valuesFontSize'),
			theme: rulesUtil.getProperty('valuesTheme'),
			showLineNumbers: rulesUtil.getProperty('valuesShowLineNumbers'),
			values: rulesUtil.getValue()
		}
	});
};