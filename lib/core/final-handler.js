module.exports = function(req, res, next) {
	next(new Error('Unrecognized url ' + req.options.url));
};

