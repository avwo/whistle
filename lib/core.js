var util = require('../util');
var rules = require('./rules');
var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var extend = require('util')._extend;
var EventEmitter = require('events').EventEmitter;
var Transform = require('stream').Transform;
var PassThrough = require('stream').PassThrough;
var transformHttps = require('../https/transform.js');
var config = require('../util').config;

function transform(chunk, encoding, callback) {
	var data = {
			encoding: encoding,
			data: chunk
	};
	var self = this;
	
	self.emit('data', data);
	
	function execCallback() {
		self._setResponseTimeout && self._setResponseTimeout();
		callback(data.error, data.data);
	}
	
	self._clearResponseTimeout && self._clearResponseTimeout();
	
	if (data.delay > 0) {
		setTimeout(execCallback, data.delay);
	} else {
		execCallback();
	}
}

function getTransform(eventEmitter) {
	var ts = new Transform();
	ts._transform = transform.bind(eventEmitter);
	return ts;
}

function getPort(options) {
	if (options.port) {
		return options.port;
	}
	
	if (options.protocol == 'https:') {
		return 443;
	}
	
	if (options.protocol == 'http:') {
		return 80;
	}
}

function getUIPort(options) {
	
	return options.protocol == 'https:' ? config.uisslport : config.uiport;
}

var RESET_COOKIE_RE = /secure;?|domain=([^;]+);?/ig;

function setWhistleHeaders(headers, req, isHttp, isHttps) {
	var options = req.options;
	var host = options.host ? options.host.split(':')[0] : '';
	options.host = host + (options.port ? ':' + options.port : '');
	
	headers['x-remote-ip'] = options.hosts[1] || '127.0.0.1';
	
	var matcher = options.rule && options.rule.matcher;
	if (matcher) {
		headers['x-' + config.name + '-rule'] = matcher;
	}
	
	if (req.headPath) {
		headers['x-' + config.name + '-head'] = req.headPath;
	}
	
	if (matcher || isHttps) {
		headers['x-remote-url'] = isHttp ? url.format(options) : options.url;
	}
	
	if (!isHttps) {
		return;
	}
	
	var cookies = headers['set-cookie'];
	
	if (!Array.isArray(cookies)) {
		return;
	}
	
	host = host.split('.');
	var len = host.length;
	if (host.length > 2) {
		host = host.slice(len - 2);
	}
	host = '.' + host.join('.');
	
	headers['set-cookie'] = cookies.map(function(cookie) {
		return cookie.replace(RESET_COOKIE_RE, '') + '; DOMAIN=' + host + ';';
	});
}

function getOptions(fullUrl) {
	var options = url.parse(fullUrl);
	options.hosts = ['127.0.0.1', '127.0.0.1'];
	options.url = fullUrl;
	return options;
}

function parseJSON(url, callback) {
	if (!url) {
		callback();
		return;
	}
	fs.readFile(util.getPath(url), {encoding: 'utf8'}, function(err, data) {
		if (err || !data) {
			callback(err);
			return;
		}
		
		callback(null, util.parseJSON(data));
	});
}

module.exports = function(req, res, next) {
	var self = this;
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	var request = new EventEmitter();
	var response = new EventEmitter();
	var timeoutId, clientReq;
	var isResponded, aborted;
	
	function setResponseTimeout() {
		clearResponseTimeout();
		timeoutId = setTimeout(abort, config.timeout);
	}
	
	function clearResponseTimeout() {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
	
	function abort(err) {
		if (aborted) {
			return;
		}
		aborted = true;
		clearResponseTimeout();
		if (clientReq) {
			clientReq.abort();
		}
		res.destroy();
		
		if (isResponded) {
			if (EventEmitter.listenerCount(response, 'error') > 0) {
				response.emit('error', err);
			}
		} else if (EventEmitter.listenerCount(request, 'error') > 0) {
			request.emit('error', err);
		}
	}
	
	setResponseTimeout();
	
	function handleResolve(err, options) {
		req.options = options;
		req.proxy = {
				url: fullUrl,
				util: util,
				hosts: rules,
				request: request,
				response: response
		};
		
		var isUIRequest;
		var port = getPort(options);
		if (util.isLocalAddress(options.hosts[1])) {
			if (port == config.port) {
				res.redirect(302, options.protocol + '//' + config.localUIHost + options.path);
				return;
			}
			
			isUIRequest = port == config.uiport || port == config.uisslport;
		}
		
		
		
		if (!isUIRequest) {
			self.emit('proxy', req.proxy);
		}
		
		request.emit('request', req);
		bindErrorEvents(req);
		bindErrorEvents(res);
		
		req.on('end', function() {
			request.emit('end');
		});
		
		req.on('close', abort);
		
		res.on('finish', function() {
			clearResponseTimeout();
			response.emit('end');
		});
		
		req.request = function (options) {
			clientReq = (options.protocol == 'https:' ? https : http).request(options, res.response);
			setResponseTimeout();
			bindErrorEvents(clientReq);
			request._setResponseTimeout = setResponseTimeout;
			request._clearResponseTimeout = clearResponseTimeout;
			req.pipe(getTransform(request)).pipe(clientReq);
		};
		
		res.response = function(_res) {
			if (isResponded) {
				return;
			}
			
			var headers = _res.headers || {};
			var statusCode = _res.statusCode || 0;
			extend(headers, res.resHeaders);
			setResponseTimeout();
			bindErrorEvents(_res);
			isResponded = true;
			
			if (headers.location) {
				//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
				headers.location = util.toWhistleSsl(req, util.encodeNonAsciiChar(headers.location));
			}
			
			setWhistleHeaders(headers, req, util.isWebProtocol(req.options.protocol), req.isHttps);
			response.emit('response', _res);
			response._setResponseTimeout = setResponseTimeout;
			response._clearResponseTimeout = clearResponseTimeout;
			_res = _res.pipe(getTransform(response));
			
			if (req.isHttps) {
				_res = transformHttps(headers, _res);
			}
			
			res.writeHead(statusCode, headers);
			_res.pipe(res);
		};
		
		function bindErrorEvents(req) {
			req.on('error', abort);
		}
		
		err ? req.emit('error', err) : next();
	}
	
	if (req.headers.host == config.localUIHost) {
		var options = getOptions(fullUrl);
		options.port = getUIPort(options); 
		handleResolve(null, options);
	} else {
		var headPath = rules.resolveHead(fullUrl);
		parseJSON(headPath, function(err, data) {
			if (data) {
				req.headPath = headPath;
				if (data.statusCode != null) {
					handleResolve(null, getOptions(fullUrl));
					res.response(util.wrapResponse(data));
					return;
				}
				
				res.resHeaders = data.res;
				extend(req.headers, data.req);
				
			} else if (headPath) {
				req.headPath = 'error(' + (err ? err.message : 'SyntaxError') + ')';
			}
			
			rules.resolve(fullUrl, handleResolve);
		});
	}
	
};