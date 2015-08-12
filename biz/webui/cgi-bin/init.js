var getRules = require('./rules');
var getValues = require('./values');
var util = require('./util');
var config = require('../lib/config');

module.exports = function(req, res) {
	var data = rulesUtil.getHostsData();
	data.fontSize = rulesUtil.getProperty('fontSize');
	data.showLineNumbers = rulesUtil.getProperty('showLineNumbers');
	data.theme = rulesUtil.getProperty('theme');
	data.version = config.version;
	
	res.json({
		server: util.getServerInfo(),
		rules: getRules(),
		values: getValues()
	});
};