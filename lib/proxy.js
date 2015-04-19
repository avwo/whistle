var util = require('../util');
var rules = require('./rules');

module.exports = function(req, res, next) {
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	
	rules.resolve(fullUrl, function handleResolve(err, options) {
		req.options = options;
		err ? req.emit('error', err) : next();
	});
};