var PipeStream = require('pipestream');
var util = require('../util');
var config = util.config;

function addErrorEvents(req, res) {
	var clientReq, clientRes, errorEmitted;
	var reqTransform, resTransform;
	req.on('dest', function(_req) {
		clientReq = _req.on('error', onReqError);
	}).on('error', onReqError)
	.on('close', onReqError);
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

function addTransforms(req, res) {
	var reqTextTransforms, resZipTransforms, resIconvTransforms;
	req.addTextTransform = function(transform) {
		if (!reqTextTransforms) {
			reqTextTransforms = util.getPipeIconvStream(req.headers, true);
			req.add(reqTextTransforms);
		}
		reqTextTransforms.add(transform);
		return req;
	};
	
	res.addZipTransform = function(transform) {
		if (!resZipTransforms) {
			resZipTransforms = [];
			res.add(function(src, next) {
				var pipeStream = util.getPipeZipStream(res.headers);
				resZipTransforms.forEach(function(pipe) {
					pipeStream.addHead(pipe);
				});
				
				if (resIconvTransforms) {
					var _pipeStream = util.getPipeIconvStream(res.headers);
					pipeStream.add(_pipeStream);
					resIconvTransforms.forEach(function(pipe) {
						_pipeStream.add(pipe);
					});
				}
				
				next(src.pipe(pipeStream));
			});
		}
		
		transform && resZipTransforms.push(transform);
	
		return res;
	};
	res.addTextTransform = function(transform) {
		if (!resIconvTransforms) {
			res.addZipTransform();
			resIconvTransforms = [];
		}
		resIconvTransforms.push(transform);
		return res;
	};
}

module.exports = function(req, res, next) {
	PipeStream.wrap(req);
	PipeStream.wrap(res, true);
	addTransforms(req, res);
	addErrorEvents(req, res);
	next();
};