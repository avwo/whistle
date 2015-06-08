var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;
var util = require('../../util');
var rules = require('../rules');
var KEYS = ['statusCode', 'httpVersion', 'headers', 'trailers', 'hostname', 'path',
            'method', 'httpVersionMajo', 'httpVersionMino', 'upgrade', 'dnsTime'];

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
	request.host = req.hostIp;
	request.ip = req.ip;
	request.url = util.getFullUrl(req);
	request.rules = req.rules;
	proxy.emit('request', request);
	
	res.on('src', function() {
		KEYS.forEach(function(key) {
			response[key] = res[key];
		});
		response.ip = req.hostIp || '127.0.0.1';
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
	var now = Date.now();
	var self = this;
	rules.resolveHost(req.matchedUrl, function(err, ip) {
		req.dnsTime = Date.now() - now;
		addDataEvents(req, res, self);
		if (err) {
			util.emitError(req, err);
			return;
		}
		req.hostIp = ip;
		req.options.host = ip;
		addTimeout(req, res, req.timeout || self.config.timeout);
		next();
	});
};

