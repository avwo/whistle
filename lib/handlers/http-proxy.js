var util = require('../util');

module.exports = function(req, res, next) {
	var protocol = req.options && req.options.protocol;
	if (!util.isProxyProtocol(protocol) && !util.isWebProtocol(protocol)) {
		next();
		return;
	}
	req.request(req.options);
};