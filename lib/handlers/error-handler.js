var Readable = require('stream').Readable;
var util = require('../util');

module.exports = function(err, req, res, next) {
	util.drain(req, function() {
		res.response(util.wrapGatewayError(util.getErrorStack(err)));
	});
};