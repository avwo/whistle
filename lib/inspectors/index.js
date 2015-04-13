var PipeStream = require('pipestream');

module.exports = function(req, res, next) {
	PipeStream.wrap(req, {pipeError: true});
	PipeStream.wrap(res, true);
	
	next();
};
