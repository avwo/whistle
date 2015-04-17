var PipeStream = require('pipestream');
var Transform = PipeStream.Transform;
var util = require('../../../util');

module.exports = function(req, res, next) {
	var request = new Transform();
	var response = new Transform();
	req.append(request);
	res.append(response);
	
	req.on('dest', function(_req) {
		request.util = util;
		request.url = util.getFullUrl(req);
		request.remoteAddress = req.remoteAddress || '127.0.0.1';
		request.headers = req.headers;
		req.emit('entry', request);
	});
	
	res.on('src', function(_res) {
		response.headers = _res.headers;
		request.emit('response', response);
	});
	
	next();
};