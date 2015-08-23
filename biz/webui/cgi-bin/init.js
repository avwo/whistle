var getRules = require('./rules');
var getValues = require('./values');
var util = require('./util');
var config = require('../lib/config');

module.exports = function(req, res) {
	
	res.json({
		version: config.version,
		server: util.getServerInfo(),
		rules: getRules(),
		values: getValues()
	});
};