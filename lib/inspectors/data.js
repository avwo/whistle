var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;
var util = require('../../util');
var KEYS = ['statusCode', 'httpVersion', 'headers', 'trailers', 
            'method', 'httpVersionMajo', 'httpVersionMino', 'upgrade'];

module.exports = function(req, res, next) {

	if (EventEmitter.listenerCount(this, 'request') > 0) {
		var request = new Transform();
		var response = new Transform();
		var emitted;
		
		function emitError(obj, err) {
			if (emitted) {
				return;
			}
			emitted = true;
			if (EventEmitter.listenerCount(obj, 'error') > 0) {
				obj.emit('error', err || new Error('unknown'));
			}
		}
		
		function emitReqError(err) {
			emitError(request, err);
		}
		
		function emitResError(err) {
			emitError(response, err);
		}
		
		req.on('dest', function(_req) {
			_req.on('error', emitReqError);
		}).on('error', emitReqError)
		.on('close', emitReqError);
		
		res.on('src', function(_res) {
			_res.on('error', emitResError);
		}).on('error', emitResError);
		
		req.addTail(request, {pipeError: false});
		res.addTail(response, {pipeError: false});
		
		KEYS.forEach(function(key) {
			request[key] = req[key];
		});
		request.url = util.getFullUrl(req);
		this.emit('request', request);
		
		res.on('src', function() {
			response.headers = res.headers;
			response.host = req.hostIp || '127.0.0.1';
			request.emit('response', response);
		});
	}

	next();
};

