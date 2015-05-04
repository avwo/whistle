module.exports = function(req, res, next) {
	util.parseFileToJson(req.rules.head && req.rules.head.url, 
			function(err, data) {
		if (data) {
			req.rules
		}
		next();
	});
};