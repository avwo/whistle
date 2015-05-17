var path = require('path');
var fs = require('fs');
var util = require('../../../../util');
var dataUtil = require('./util');
var requests = [];
var responses = [];
var writingRequest, writingResponse;
var count = 0;

function writeRequest() {
	if (writingRequest || !requests.length) {
		return;
	}
	writingRequest = true;
	fs.writeFile(path.join(dataUtil.URLS_DATA_PATH, getFilename()), 
			requests.join('\n') + '\n', {flag: 'a+'}, writeRequestCb);
	requests = [];
}

function writeResponse() {
	if (writingResponse || !responses.length) {
		return;
	}
	writingResponse = true;
	fs.writeFile(path.join(dataUtil.HEADERS_DATA_PATH, getFilename()), 
			responses.join('\n') + '\n', {flag: 'a+'}, writeResponseCb);
	responses = [];
}

function writeRequestCb(err) {
	writingRequest = false;
	writeRequest();
}

function writeResponseCb(err) {
	writingResponse = false;
	writeResponse();
}

function getFilename() {
	return Math.floor(Date.now() / dataUtil.ONE_HOUR) + '';
}

function pushRequest(req) {
	requests.push([req.id, req.method || 'GET', req.httpVersion || '1.1', req.url,
	               req.host || '127.0.0.1', JSON.stringify(req.headers || {})].join(' '));
	writeRequest();
}

function pushResponse(res) {
	responses.push([res.id, res.statusCode || 0,  res.dnsTime || 0,  res.requestTime || 0
	                ,  res.responseTime || 0, res.endTime || 0, 
	                res.host || '127.0.0.1', JSON.stringify(res.headers || {})].join(' '));
	writeResponse();
}

function handleRequest(request) {
	var startTime = Date.now();
	var requestTime = 0;
	var id = request.id = startTime + '-' + ++count;
	var maxSize = dataUtil.MAX_SIZE;
	
	pushRequest(request);
	request.on('response', handleResponse);
	request.on('error', function(err) {
		var responseTime = Date.now() - startTime;
		pushResponse({
			id: id,
			statusCode: -1,
			host: request.host,
			headers: {stack: err.stack},
			dnsTime: request.dnsTime,
			requestTime: responseTime,
			responseTime: responseTime,
			endTime: responseTime
		});
		request.removeListener('response', handleResponse);
		request._transform = passThrough;
	});
	
	var reqFile;
	if (util.hasRequestBody(request)) {
		reqFile = fs.createWriteStream(path.join(dataUtil.REQ_PATH, id + ''));
		reqFile.on('error', function() {
			reqFile = null;
		});
	}
	
	request._transform = function(chunk, encoding, callback) {
		if (reqFile) {
			if (chunk) {
				maxSize -= chunk.length;
				reqFile.write(chunk);
			}
			
			if (!chunk || maxSize <= 0) {
				reqFile.end();
				reqFile = null;
			}
		}
		
		if (!chunk) {
			requestTime = Date.now() - startTime;
		}
		
		callback(null, chunk);
	};
	
	
	function handleResponse(response) {
		response.id = id;
		response.responseTime = Date.now() - startTime;
		
		var resFile;
		var contentType = util.getContentType(response.headers);
		if (util.hasBody(response) && contentType && contentType != 'IMG') {
			resFile = fs.createWriteStream(path.join(dataUtil.RES_PATH, id + ''));
			resFile.on('error', function() {
				resFile = null;
			});
		}

		response._transform = function(chunk, encoding, callback) {
			if (resFile && chunk) {
				resFile.write(chunk);
			}
			
			if (!chunk) {
				writeResponseHeaders();
				resFile = null;
			}
			
			callback(null, chunk);
		};
		
		response.on('error', function(err) {
			response.headers['x-error-msg'] = err.stack;
			writeResponseHeaders();
		});
		
		function writeResponseHeaders() {
			response.dnsTime = request.dnsTime;
			response.requestTime = requestTime;
			response.endTime = Date.now() - startTime;
			resFile && resFile.end();
			pushResponse(response);
		}
	}
	
}

function passThrough(chunk, encoding, callback) {
	callback(null, chunk);
}

function handleTunnel(request) {
	request.id = Date.now() + '-' + ++count;
	request.method = 'TUNNEL';
	pushRequest(request);
}

function handleTunnelProxy(request) {
	request.id = Date.now() + '-' + ++count;
	request.method = 'TUNNELPROXY';
	pushRequest(request);
}

module.exports = function(proxy) {
	proxy.on('request', handleRequest);
	proxy.on('tunnel', handleTunnel);
	proxy.on('tunnelProxy', handleTunnelProxy);
	require('./clean')();
};

