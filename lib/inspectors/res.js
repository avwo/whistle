var https = require('https');
var http = require('http');
var extend = require('util')._extend;
var util = require('../../util');
var WhistleTransform = util.WhistleTransform;
var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;
var rules = require('../rules');
var KEYS = ['statusCode', 'httpVersion', 'headers', 'trailers', 'hostname', 'path',
            'method', 'httpVersionMajo', 'httpVersionMino', 'upgrade', 'dnsTime', 'realUrl'];


function addRuleHeaders(headers, req, name) {
	name = 'x-' + name + '-';
	var rules = req.rules;
	for (var i in rules) {
		headers[name + i] = rules[i].matcher;
	}
	headers['x-remote-ip'] = req.hostIp || '127.0.0.1';
	return headers;
}

function handleRes(res, data) {
	if (data) {
		extend(res.headers, data.headers);
		res.addZipTransform(new WhistleTransform(data));
	}
	
}

function addDataEvents(req, res, proxy) {
	if (req._fromProxy || !EventEmitter.listenerCount(proxy, 'request')) {
		return;
	}
	util.removeUnsupportsHeaders(req.headers, true);
	
	var request = new Transform();
	var response = new Transform();
	var emitted;
	
	function emitError(obj, err) {
		if (emitted) {
			return;
		}
		emitted = true;
		util.emitError(obj, err);
	}
	
	function emitReqError(err) {
		request.host = req.hostIp;
		emitError(request, err || new Error('unkown'));
	}
	
	function emitResError(err) {
		request.host = req.hostIp;
		emitError(response, err || new Error('unkown'));
	}
	
	req.on('error', emitReqError);
	
	res.on('src', function(_res) {
		_res.on('error', emitResError);
	}).on('error', emitResError);
	
	req.append(request, {pipeError: false});
	res.append(response, {pipeError: false});
	
	KEYS.forEach(function(key) {
		request[key] = req[key];
	});
	request.host = req.hostIp;
	request.ip = req.ip;
	request.isWhistleHttps = req.isWhistleHttps;
	request.url = util.getFullUrl(req);
	request.rules = req.rules;
	proxy.emit('request', request);
	
	req.on('dest', function() {
		request.host = req.hostIp;
		request.realUrl = req.realUrl;
		request.emit('send');
	});
	
	res.on('src', function() {
		KEYS.forEach(function(key) {
			response[key] = res[key];
		});
		request.host = req.hostIp || '127.0.0.1';
		request.emit('response', response);
	});

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
	var config = this.config;
	var self = this;
	var responsed, resData;
	req.request = function(options) {
		if (!options.proxy && util.isLocalAddress(options.host) && (options.port || 80) == config.port) {
			util.drain(req, function() {
				res.response(util.wrapResponse({
					statusCode: 302,
					headers: {
						location: 'http://' + config.localUIHost + (options.path || '')
					}
				}));
			});
			return;
		}
		
		var isHttps = options.protocol == 'https:';
		var client = (isHttps ? https : http).request(options, res.response);
		req.hostIp = options._proxyHost || options.host;
		req.realUrl = res.realUrl = (isHttps ? 'https://' : 'http://') + options.headers.host + options.path;
			
		req.on('close', function() {
			!responsed && util.emitError(req, new Error('aborted'));
		});
		
		client.on('error', function(err) {
			util.drain(req, function() {
				res.response(util.wrapGatewayError(err.stack));
			});
		});
		req.pipe(client);
	};
	
	res.response = function(_res) {
		if (responsed) {
			return;
		}
		responsed = true;
		if (_res.realUrl) {
			req.realUrl = res.realUrl = _res.realUrl;
		}
		var headers = res.headers = _res.headers;
		res.trailers = _res.trailers;
		res.statusCode = _res.statusCode = _res.statusCode || 0;
		handleRes(res, resData);
		addRuleHeaders(headers, req, config.name);
		if (headers.location) {
			//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
			headers.location = util.encodeNonAsciiChar(headers.location);
		}
		res.src(_res);
		res.writeHead(_res.statusCode, _res.headers);
		res.trailers && res.addTrailers(res.trailers);
	};
	
	util.parseRuleToJson(req.rules.res, 
			function(err, data) {
		if (req.rules.head && req.rules.head.res) {
			data = extend(req.rules.head.res, data);
		}
		
		function emitDataEvents() {
			addDataEvents(req, res, self);
			addTimeout(req, res, req.timeout || config.timeout);
		}
		
		if (resData = data) {
			data.headers = util.lowerCaseify(data.headers);
			if (data.statusCode) {
				req.hostIp = '127.0.0.1';
				emitDataEvents();
				util.drain(req, function() {
					res.response(util.wrapResponse(data));
				});
				return;
			}
			
			if (data.top || data.bottom || data.body) {
				util.removeUnsupportsHeaders(req.headers);
			}
		}
		
		var now = Date.now();
		rules.resolveHost(req.matchedUrl, function(err, ip) {
			req.dnsTime = Date.now() - now;
			if (err) {
				emitDataEvents();
				util.drain(req, function() {
					  res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + err.stack));
					});
				return;
			}
			req.hostIp = ip;
			req.options.host = ip;
			emitDataEvents();
			next();
		});
	});
};