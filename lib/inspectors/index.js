var PipeStream = require('pipestream');
var util = require('../../util');

module.exports = function(req, res, next) {
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	PipeStream.wrap(req);
	PipeStream.wrap(res, true);
	
	next();
};
