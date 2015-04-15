var PipeStream = require('pipestream');
var url = require('url');
var https = require('https');
var http = require('http');
var util = require('../../util');
var config = util.config;

module.exports = function(req, res, next) {
	PipeStream.wrap(req);
	PipeStream.wrap(res, true);
	
	var clientReq, clientRes, errorEmitted;
	var reqTransform, resTransform;
	req.on('dest', function(_req) {
		clientReq = _req.on('error', onReqError);
	}).on('error', onReqError);
	res.on('src', function(_res) {
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
	
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	if (req.headers.host == config.localUIHost) {
		var options = url.parse(fullUrl);
		options.host = '127.0.0.1';
		options.hostname = null;
		options.port = config.uiport;
		options.headers = req.headers;
		req.pipe(http.request(options, function(_res) {
			res.writeHead(_res.statusCode || 0, _res.headers);
			res.src(_res);
		}));
		return;
	}
	
	next();
};
