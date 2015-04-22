var PipeStream = require('pipestream');
var Transform = PipeStream.Transform;
var util = require('../util');
var config = util.config;
var TIMEOUT = config.timeout || 32000;

function addErrorEvents(req, res) {
	var clientReq, clientRes;
	req.on('dest', function(_req) {
		clientReq = _req.on('error', abortRes);
	}).on('error', abortReq)
	.on('close', abortReq);
	res.on('src', function(_res) {
		clientRes = _res.on('error', abortRes);
	}).on('error', abortReq);
	
	function abortReq() {
		clientReq && clientReq.abort();
		clientReq = null;
	}
	
	function abortRes() {
		res && res.destroy();
		res = null;
	}
}

function addTransforms(req, res) {
	var reqTextPipeStream, resZipPipeStream, resIconvPipeStream;
	
	req.addTextTransform = function(transform) {
		if (!reqTextPipeStream) {
			reqTextPipeStream = util.getPipeIconvStream(req.headers, true);
			req.add(reqTextPipeStream);
		}
		reqTextPipeStream.add(transform);
		return req;
	};
	
	function initZipTransform() {
		if (!resZipPipeStream) {
			resZipPipeStream = new PipeStream();
			res.add(function(src, next) {
				var pipeZipStream = util.getPipeZipStream(res.headers);
				pipeZipStream.addHead(resZipPipeStream);
				if (resIconvPipeStream) {
					var pipeIconvStream = util.getPipeIconvStream(res.headers);
					pipeIconvStream.add(resIconvPipeStream);
					pipeZipStream.add(pipeIconvStream);
				}
				next(src.pipe(pipeZipStream));
			});
		}
		
		return resZipPipeStream;
	}
	
	res.addZipTransform = function(transform, head) {
		initZipTransform()[head ? 'addHead' : 'add'](transform);
		return res;
	};
	res.addTextTransform = function(transform, head) {
		if (!resIconvPipeStream) {
			initZipTransform();
			resIconvPipeStream = new PipeStream();
		}
		resIconvPipeStream[head ? 'addHead' : 'add'](transform);
		return res;
	};
	
	res.on('src', function(_res) {
		if (resZipPipeStream || resIconvPipeStream) {
			delete _res.headers['content-length'];
		}
	});
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

module.exports = function(req, res, next) {
	PipeStream.wrapSrc(req);
	PipeStream.wrapDest(res);
	addTransforms(req, res);
	addErrorEvents(req, res);
	addTimeout(req, res);
	next();
};