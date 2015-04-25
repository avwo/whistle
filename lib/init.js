var PipeStream = require('pipestream');
var Transform = PipeStream.Transform;
var util = require('../util');

function addErrorEvents(req, res) {
	var clientReq, clientRes;
	req.on('dest', function(_req) {
		clientReq = _req.on('error', abort);
	}).on('error', abort)
	.on('close', abort);
	res.on('src', function(_res) {
		clientRes = _res.on('error', abort);
	}).on('error', abort);
	
	function abort() {
		clientReq && clientReq.abort();
		res && res.destroy();
		clientReq = null;
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

module.exports = function(req, res, next) {
	PipeStream.wrapSrc(req);
	PipeStream.wrapDest(res);
	addTransforms(req, res);
	addErrorEvents(req, res);
	next();
};