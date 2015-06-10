var Readable = require('stream').Readable;
var util = require('../../util');

module.exports = function(err, req, res, next) {
	res.response(util.wrapGatewayError(err.stack));
};