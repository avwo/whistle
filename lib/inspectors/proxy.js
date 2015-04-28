var util = require('../../util');

module.exports = function(req, res, next) {
	var options = req.options;
	if (!req.options.proxy || options.protocol == 'http:') {
		return next();
	}
	options.protocol = null;
	util.proxyHttps(req, function(err, _res) {
		err ? res.emit('error', err) : res.response(_res);
	});
};