module.exports = function(req, res, next) {
	next(new Error('Unrecognized protocol ' + req.options.protocol));
};

