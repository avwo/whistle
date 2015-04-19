var PipeStream = require('pipestream');
var util = require('../util');
var config = util.config;

function addErrorEvents(req, res) {
	var clientReq, clientRes;
	req.on('dest', function(_req) {
		clientReq = _req.on('error', function(err) {
			req.emit('error', err);
		});
	}).on('error', abort)
	.on('close', function() {
		req.emit('error', new Error('abort'));
	});
	res.on('src', function(_res) {
		clientRes = _res.on('error', function(err) {
			res.emit('error', err);
		});
	}).on('error', abort);
	
	function abort() {
		clientReq && clientReq.abort();
		res.destroy();
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
	PipeStream.wrapSrc(req, {pipeError: true});
	PipeStream.wrapDest(res, {pipeError: true});
	addTransforms(req, res);
	addErrorEvents(req, res);
	next();
};