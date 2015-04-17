var PipeStream = require('pipestream');
var Transform = PipeStream.Transform;
var util = require('../../../util');

module.exports = function(req, res, next) {
	var request = new Transform();
	var response = new Transform();
	
	request.util = util;
	request.url = util.getFullUrl(req);
	request.headers = req.headers;
	req.emit('entry', request);
	req.append(request)
	
	res.on('src', function(_res) {
		response.headers = _res.headers;
		request.emit('response', response);
	});
	
	next();
};