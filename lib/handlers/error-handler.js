var Readable = require('stream').Readable;
var util = require('../../util');

module.exports = function(err, req, res, next) {
	res.response(util.wrapResponse({
		statusCode: 502,
		headers: {
			'content-type': 'text/plain'
		},
		body: err.stack
	}));
};