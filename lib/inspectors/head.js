module.exports = function(req, res, next) {
	if (options.hostname || req.options.protocol == 'http:') {
		return next();
	}
	
	
};