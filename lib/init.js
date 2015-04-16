var PipeStream = require('pipestream');
var util = require('../util');
var config = util.config;

function addErrorEvents(req, res) {
	var clientReq, clientRes, errorEmitted;
	var reqTransform, resTransform;
	req.on('dest', function(_req) {
		clientReq = _req.on('error', onReqError);
	}).on('error', onReqError);
	res.on('src', function(_res) {
		res.headers = _res.headers;
		clientRes = _res.on('error', onResError);
	}).on('error', onResError);
	
	function onReqError(err) {
		onError(reqTransform, err);
	}
	
	function onResError(err) {
		onError(resTransform, err);
	}
	
	function onError(obj, err) {
		if (errorEmitted) {
			return;
		}
		errorEmitted = true;
		clientReq && clientReq.abort();
		res.destroy();
		if (obj && EventEmitter.listenerCount(obj, 'error') > 0) {
			obj.emit('error', err || new Error('Unknown'));
		}
	}
}

module.exports = function(req, res, next) {
	PipeStream.wrap(req);
	PipeStream.wrap(res, true);
	
	req.addTextTransform = function(transform) {
		
		return req;
	};
	res.addZipTransform = function(transform) {
		if (res._zipPipeTransform) {
			res._zipPipeTransform.add(transform);
			return;
		}
		res._zipPipeTransform = util.getPipeZipStream()
		.add(res._textPipeTransform);
		res.add(res._zipPipeTransform);
	
		return res;
	};
	res.addTextTransform = function(transform) {
		if (res._textPipeTransform) {
			res._textPipeTransform.add(transform);
			return;
		}
		
		res._textPipeTransform = util.getPipeIcovStream();
		if (!res._zipPipeTransform) {
			res._zipPipeTransform = util.getPipeZipStream();
			res.add(res._zipPipeTransform);
		}
		res._zipPipeTransform.add(res._textPipeTransform);
		
		return res;
	};
	
	addErrorEvents(req, res);
	
	next();
};