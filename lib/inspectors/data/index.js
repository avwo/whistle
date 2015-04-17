var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;
var util = require('../../../util');

module.exports = function(req, res, next) {
	if (EventEmitter.listenerCount(this, 'entry') > 0) {
		var request = new Transform();
		var response = new Transform();
		req.append(request);
		res.append(response);
		req.on('dest', function() {
			request.url = util.getFullUrl(req);
			request.remoteAddress = req.remoteAddress || '127.0.0.1';
			request.headers = req.headers;
			this.emit('entry', request);
		});
		
		res.on('src', function() {
			response.headers = res.headers;
			request.emit('response', response);
		});
	}
	
	next();
};

