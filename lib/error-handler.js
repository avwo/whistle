var Readable = require('stream').Readable;
var util = require('../util/util');
var config = require('../package.json');

module.exports = function(err, req, res, next) {
	req.emit('error', err);
};