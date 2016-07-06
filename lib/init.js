var PipeStream = require('pipestream');
var util = require('./util');
var config = require('./config');

function addErrorEvents(req, res) {
	var clientReq;
	req.on('dest', function(_req) {
		clientReq = _req.on('error', util.noop);
	}).on('error', abort)
		.on('close', abort);
	
	res.on('src', function(_res) {
		_res.on('error', abort);
	}).on('error', abort);
	
	function abort(err) {
		if (clientReq) {
			if (clientReq.abort) {
				clientReq.abort();
			} else if (clientReq.destroy) {
				clientReq.destroy();
			}
		}
		res.destroy();
	}
}

function addTransforms(req, res) {
	var reqTextPipeStream, resZipPipeStream, resIconvPipeStream, svrRes;
	
	req.addTextTransform = function(transform) {
		if (!reqTextPipeStream) {
			reqTextPipeStream = util.getPipeIconvStream(req.headers, true);
			delete req.headers['content-length'];
			req.add(reqTextPipeStream);
		}
		reqTextPipeStream.add(transform);
		return req;
	};
	
	function initZipTransform() {
		if (!resZipPipeStream) {
			resZipPipeStream = new PipeStream();
			removeContentLength();
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
	
	res.addZipTransform = function(transform, head, tail) {
		initZipTransform()[head ? 'addHead' : (tail ? 'addTail' : 'add')](transform);
		return res;
	};
	res.addTextTransform = function(transform, head, tail) {
		if (!resIconvPipeStream) {
			initZipTransform();
			resIconvPipeStream = new PipeStream();
		}
		resIconvPipeStream[head ? 'addHead' : (tail ? 'addTail' : 'add')](transform);
		return res;
	};
	
	res.on('src', function(_res) {
		svrRes = _res;
		removeContentLength();
	});
	
	function removeContentLength() {
		if (svrRes && (resZipPipeStream || resIconvPipeStream)) {
			delete svrRes.headers['content-length'];
		}
	}
}

module.exports = function(req, res, next) {
	PipeStream.wrapSrc(req);
	PipeStream.wrapDest(res);
	addTransforms(req, res);
	addErrorEvents(req, res);
	var socket = req.socket || {};
	socket[config.CLIENT_IP_HEAD] = req.headers[config.CLIENT_IP_HEAD] 
			= socket[config.CLIENT_IP_HEAD] || util.getClientIp(req);
	if (req.headers[config.HTTPS_FIELD] || req.socket.isHttps) {//防止socket长连接导致新请求的头部无法加util.HTTPS_FIELD
		req.socket.isHttps = true;
		req.isHttps = true;
		delete req.headers[config.HTTPS_FIELD];
	}
	
	var responsed;
	res.response = function(_res) {
		if (responsed) {
			return;
		}
		responsed = true;
		if (_res.realUrl) {
			req.realUrl = res.realUrl = _res.realUrl;
		}
		res.headers = _res.headers;
		res.trailers = _res.trailers;
		res.statusCode = _res.statusCode = util.getStatusCode(_res.statusCode);
		
		util.drain(req, function() {
			if (util.getStatusCode(_res.statusCode)) {
				res.writeHead(_res.statusCode, _res.headers);
				res.src(_res);
				_res.trailers && res.addTrailers(_res.trailers);
			} else {
				util.sendStatusCodeError(res, _res);
			}
		});
	};
	
	next();
};