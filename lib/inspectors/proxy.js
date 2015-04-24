module.exports = function(req, res, next) {
	var options = req.options;
	if (options.hostname || options.protocol == 'http:') {
		return next();
	}
	
	next();
};