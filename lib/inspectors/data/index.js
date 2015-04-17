var Transform = require('pipestream').Transform;

module.exports = function(req, res, next) {
	var request = new Transform();
	next();
};