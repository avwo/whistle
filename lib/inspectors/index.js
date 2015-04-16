var PipeStream = require('pipestream');
var convertHttps = require('./https');
var config = require('../../util').config;

module.exports = function(req, res, next) {
	PipeStream.wrap(req);
	PipeStream.wrap(res, true);
	addErrorEvents(req, res);
	convertHttps(req, res);
	addDataEvents(req, res);
	
	next();
};

function addErrorEvents(req, res) {
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
}

function addDataEvents(req, res) {
	
}