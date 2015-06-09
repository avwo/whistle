var Readable = require('stream').Readable;
var util = require('../../util');

module.exports = function(err, req, res, next) {
	res.response(util.wrapResponse({
		statusCode: 500,
		headers: {
			'content-type': 'text/plain'
		},
		body: err.stack
	}));
};