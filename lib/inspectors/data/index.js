var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;
var util = require('../../../util');
var config = util.config;
var TIMEOUT = config.timeout || 32000;

module.exports = function(req, res, next) {
	addDumpEvents(req, res);
	addTimeout(req, res);
	next();
};

function addDumpEvents(req, res) {
	if (EventEmitter.listenerCount(this, 'request') > 0) {
		var request = new Transform();
		var response = new Transform();
		function emitReqError(err) {
			EventEmitter.listenerCount(request, 'error') > 0 && request.emit('error', err);
		}
		
		function emitResError(err) {
			EventEmitter.listenerCount(response, 'error') > 0 && response.emit('error', err);
		}
		
		req.on('dest', function(_req) {
			_req.on('error', emitReqError);
		}).on('error', emitReqError);
		res.on('src', function(_res) {
			_res.on('error', emitResError);
		}).on('error', emitResError);
		
		req.append(request, {pipeError: false});
		res.append(response, {pipeError: false});
		req.on('dest', function() {
			request.url = util.getFullUrl(req);
			request.remoteAddress = req.remoteAddress || '127.0.0.1';
			request.headers = req.headers;
			this.emit('request', request);
		});
		
		res.on('src', function() {
			response.headers = res.headers;
			request.emit('response', response);
		});
	}
}

function addTimeout(req, res) {
	var timeoutId, responsed;
	var preReq = new Transform();
	var endReq = new Transform();
	var preRes = new Transform();
	var endRes = new Transform();
	
	preReq._transform = preRes._transform = function(chunk, encoding, callback) {
		timeoutId && clearTimeout(timeoutId);
		timeoutId = null;
		callback(null, chunk);
	};
	
	endReq._transform = endRes._transform = function(chunk, encoding, callback) {
		timeoutId && clearTimeout(timeoutId);
		if (!responsed || chunk) {
			timeoutId = setTimeout(emitTimeoutError, TIMEOUT);
		}
		
		if (!chunk) {
			responsed = true;
		}
		
		callback(null, chunk);
	};
	
	function emitTimeoutError() {
		(responsed ? res : req).emit('error', new Error('Timeout'));
	}
	
	req.prepend(preReq).append(endReq);
	res.prepend(preRes).append(endRes);
}
