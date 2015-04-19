var rules = require('../../rules');
var util = require('../../../util');

module.exports = function(req, res, next) {
	req._rules = rules.resolveRules(util.getFullUrl(req));
	
	next();
};