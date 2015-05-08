var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;
var util = require('../../util');
var KEYS = ['statusCode', 'httpVersion', 'headers', 'trailers', 
            'method', 'httpVersionMajo', 'httpVersionMino', 'upgrade'];

function addDataEvents(req, res, proxy) {
	if (req._fromProxy || !EventEmitter.listenerCount(proxy, 'request')) {
		return;
	}

	var request = new Transform();
	var response = new Transform();
	var emitted;
	
	function emitError(obj, err) {
		if (emitted) {
			return;
		}
		emitted = true;
		util.emitError(obj, err);
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
	
	req.append(request, {pipeError: false});
	res.append(response, {pipeError: false});
	
	KEYS.forEach(function(key) {
		request[key] = req[key];
	});
	request.url = util.getFullUrl(req);
	request.path = req.url;
	proxy.emit('request', request);
	
	res.on('src', function() {
		response.headers = res.headers;
		response.host = req.hostIp || '127.0.0.1';
		request.emit('response', response);
	});

}

function addTimeout(req, res, timeout) {
	if (!(timeout > 0)) {
		return;
	}
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
			timeoutId = setTimeout(emitTimeoutError, timeout);
		}
		
		if (!chunk) {
			responsed = true;
		}
		
		callback(null, chunk);
	};
	
	function emitTimeoutError() {
		util.emitError(responsed ? res : req, new Error('timeout'));
	}
	
	req.prepend(preReq).append(endReq);
	res.prepend(preRes).append(endRes);
}

module.exports = function(req, res, next) {
	addDataEvents(req, res, this);
	var timeout = req.timeout; //从req里面获取
	addTimeout(req, res, timeout || this.config.timeout);
	next();
};

