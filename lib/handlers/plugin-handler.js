var util = require('../util');

module.exports = function(req, res, next) {
	var protocol = req.options && req.options.protocol;
	if (protocol != 'plugin:') {
		next();
		return;
	}
	console.log('===')
	//req.request(req.options);
};