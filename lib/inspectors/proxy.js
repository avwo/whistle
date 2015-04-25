var util = require('../../util');

module.exports = function(req, res, next) {
	var options = req.options;
	if (!req.proxy || options.protocol == 'http:') {
		return next();
	}
	delete options.protocol;
	util.proxyHttps(req, function(err, _res) {
		err ? res.emit('error', err) : res.response(_res);
	});
};