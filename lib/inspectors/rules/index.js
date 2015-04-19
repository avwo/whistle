var rules = require('../../rules');
var util = require('../../../util');

module.exports = function(req, res, next) {
	var fullUrl = util.getFullUrl(req);
	req._rules = {};
	
	next();
};