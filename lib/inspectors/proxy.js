var util = require('../../util');

module.exports = function(req, res, next) {
	var options = req.options;
	if (options.hostname || options.protocol == 'http:') {
		return next();
	}
	delete options.protocol;
	util.proxyHttps(req, function(err, _res) {
		res.response(_res);
	});
};