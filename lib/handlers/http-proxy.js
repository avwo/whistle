var util = require('../util');

module.exports = function(req, res, next) {
	if (!util.isWebProtocol(req.options && req.options.protocol)) {
		next();
		return;
	}
	req.request(req.options);
};