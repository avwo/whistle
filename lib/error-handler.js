var Readable = require('stream').Readable;
var util = require('../util/util');
var config = require('../package.json');

module.exports = function(err, req, res, next) {
	res.response(util.wrapResponse({
		statusCode: 500,
		headers: {
			Server: config.name
		},
		body: err.stack
	}));
};