var iconv = require('iconv-lite');
var zlib = require('zlib');
var MAX_REQ_SIZE = 256 * 1024;
var MAX_RES_SIZE = 512 * 1024;
var LOCALHOST = '127.0.0.1';
var util = require('../util');
var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;

function passThrough(chunk, encoding, callback) {
	callback(null, chunk);
}

function decode(body) {
	if (body) {
		var _body = body + '';
		if (_body.indexOf('�') != -1) {
			_body = iconv.decode(body, 'GB18030');
		}
		body = _body;
	}
	
	return body || null;
}

function unzipBody(encoding, body, callback) {
	var unzip;
	switch (body && util.toLowerCase(encoding)) {
	    case 'gzip':
	    	unzip = zlib.gunzip.bind(zlib);
	      break;
	    case 'deflate':
	    	unzip = zlib.inflate.bind(zlib);
	      break;
	}
	
	unzip ? unzip(body, function(err, data) {
		err ? zlib.inflateRaw(body, callback) : callback(null, data);
	}) : callback(null, body);

}

function emitDataEvents(req, res, proxy) {
	if (req.filter.hide 
			|| !EventEmitter.listenerCount(proxy, 'request')) {
		delete req.headers[util.CLIENT_IP_HEAD];
		return;
	}
	var _res = {};
	var reqEmitter = new EventEmitter();
	var request = new Transform();
	var response = new Transform();
	var now = Date.now();
	var reqData = {
			method: util.toUpperCase(req.method) || 'GET', 
			httpVersion: req.httpVersion || '1.1',
            ip: util.getClientIp(req) || LOCALHOST,
            isWhistleHttps: req.isWhistleHttps,
            headers: req.headers,
            trailers: req.trailers
		};
	var resData = {};
	var data = request.data = {
			startTime: now,
			url: util.getFullUrl(req),
			req: reqData,
			res: resData,
			rules: req.rules
	};
	
	delete req.headers[util.CLIENT_IP_HEAD];
	req.once('dest', function() {
		setReqStatus();
		reqEmitter.emit('send', data);
	});
	res.once('src', function(res) {
		_res = res;
		if (data.endTime) {
			return;
		}
		receiveResBody();
		setResStatus();
		reqEmitter.emit('response', data);
	});
	req.once('close', handleError);
	req.once('error', handleError);
	req.append(request);
	res.append(response);
	
	reqEmitter.data = data;
	proxy.emit('request', reqEmitter);
	
	
	var reqBody = false;
	var reqSize = 0;
	
	if (util.hasRequestBody(req)) {
		reqBody = null;
	}
	request._transform = function(chunk, encoding, callback) {
		
		if (chunk) {
			if (reqBody || reqBody === null) {
				reqBody = reqBody ? Buffer.concat([reqBody, chunk]) : chunk;
				if (reqBody.length > MAX_REQ_SIZE) {
					reqBody = false;
				}
			}
			reqSize += chunk.length;
		} else {
			data.requestTime = Date.now();
			reqData.size = reqSize;
			reqData.body = decode(reqBody);
		}
		
		callback(null, chunk);
	};
	
	function receiveResBody() {
		var resBody = false;
		var resSize = 0;
		var contentType = util.getContentType(_res.headers);
		if (contentType && contentType != 'IMG' && util.hasBody(_res)) {
			resBody = null;
		}

		response._transform = function(chunk, encoding, callback) {
			if (chunk) {
				if (resBody || resBody === null) {
					resBody = resBody ? Buffer.concat([resBody, chunk]) : chunk;
					if (resBody.length > MAX_RES_SIZE) {
						resBody = false;
					}
				}
				resSize += chunk.length;
				callback(null, chunk);
			} else {
				unzipBody(util.toLowerCase(_res.headers['content-encoding']), resBody, 
						function(err, body) {
					resData.body = err ? util.getErrorStack(err) : decode(body);
					data.endTime = Date.now();
					resData.size = resSize;
					reqEmitter.emit('end', data);
					callback(null, chunk);
				});
			}
		};
	}
	
	function handleError(err) {
		if (data.endTime || (data.responseTime && !err)) {//connection: close的时候，还要数据缓存
			return;
		}
		
		request._transform = passThrough;
		response._transform = passThrough;
		data.endTime = Date.now();
		if (err) {
			data.resError = true;
			resData.body = util.getErrorStack(err);
			util.emitError(reqEmitter, data);
			setResStatus(502);
		} else {
			data.reqError = true;
			reqData.body = 'aborted';
			reqEmitter.emit('abort', data);
			setResStatus('aborted');
		}
	}
	
	function setReqStatus(defaultHost) {
		data.dnsTime = (req.dnsTime || 0) + now;
		data.realUrl = req.realUrl;
		resData.ip = req.hostIp || defaultHost;
	}

	function setResStatus(defaultCode) {
		setReqStatus(LOCALHOST);
		resData.statusCode = _res.statusCode || defaultCode || 502;
		resData.statusMessage = _res.statusMessage;
		if (!data.requestTime) {
			data.requestTime = Date.now();
		}
		data.responseTime = Date.now();
		resData.headers = _res.headers;
		resData.trailers = _res.trailers;
	}
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
	emitDataEvents(req, res, this);
	addTimeout(req, res, req.timeout || this.config.timeout);
	next();
};



