var Readable = require('stream').Readable;
var util = require('../util/util');

module.exports = function(err, req, res, next) {
	res.response(util.wrapResponse({
		statusCode: 500,
		body: err.stack
	}));
};