var util = require('../../util');

module.exports = function(req, res, next) {
	var options = req.options;
	if (!req.options.proxy || options.protocol == 'http:') {
		return next();
	}
};