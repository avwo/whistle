var util = require('../util/util');
var hosts = require('./hosts');
var http = require('http');
var https = require('https');
var EventEmitter = require('events').EventEmitter;
var Transform = require('stream').Transform;
var config = require('../package.json');

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
	if (!options.port) {
		if (isSecure(options.protocol)) {
			return 443;
		} else if (options.protocol == 'http:' || options.protocol == 'ws:') {
			return 80;
		}
	}
	
	return options.port;
}

function isSecure(protocol) {
	return protocol == 'https:' || protocol == 'wss:';
}

module.exports = function(req, res, next) {
	var self = this;
	var timeoutId, clientReq;
	
	function setResponseTimeout() {
		clearResponseTimeout();
		timeoutId = setTimeout(abort, self.timeout);
	}
	
	function clearResponseTimeout() {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
	
	function abort() {
		clearResponseTimeout();
		if (clientReq) {
			clientReq.abort();
		}
		res.destroy();
	}
	
	setResponseTimeout();
	
	hosts.resolve(req.fullUrl = util.getFullUrl(req), function(err, options) {
		req.options = options;
		var request = new EventEmitter();
		var response = new EventEmitter();
		
		req.proxy = {
				url: req.fullUrl,
				util: util,
				hosts: hosts,
				request: request,
				response: response
		};
		
		var requestUI;
		var port = getPort(options);
		if (util.isLocalAddress(options.hosts[1])) {
			if (port == self.port) {
				res.redirect(302, options.protocol + '//' + options.hostname + ':' 
						+ (isSecure(options.protocol) ? self.uisslport : self.uiport) + options.path);
				return;
			}
			
			requestUI = port == self.uiport || port == self.uisslport;
		}
		
		
		
		if (!requestUI) {
			self.emit('proxy', req.proxy);
		}
		
		request.emit('request', req);
		bindErrorEvents(req);
		bindErrorEvents(res);
		
		req.on('end', function() {
			request.emit('end');
		});
		
		res.on('end', function() {
			clearResponseTimeout();
			response.emit('end');
		});
		
		req.request = function (options) {
			var _req = (options.protocol == 'https:' ? https : http).request(options, res.response);
			
			setResponseTimeout();
			clientReq = _req;
			bindErrorEvents(_req);
			request._setResponseTimeout = setResponseTimeout;
			request._clearResponseTimeout = clearResponseTimeout;
			req.pipe(getTransform(request)).pipe(_req);
		};
		
		var isResponded;
		res.response = function(_res) {
			if (isResponded) {
				return;
			}
			setResponseTimeout();
			bindErrorEvents(_res);
			isResponded = true;
			if (_res.headers && _res.headers.location) {
				//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
				_res.headers.location = _res.headers.location.replace(/[^\x00-\x7F]/g, encodeURIComponent);
			}
			response.emit('response', _res);
			res.writeHead(_res.statusCode, _res.headers);
			response._setResponseTimeout = setResponseTimeout;
			response._clearResponseTimeout = clearResponseTimeout;
			_res.pipe(getTransform(response)).pipe(res);
		};
		
		function bindErrorEvents(req) {
			req.on('error', function(err) {
				abort();
				if (isResponded) {
					if (EventEmitter.listenerCount(response, 'error') > 0) {
						response.emit('error', err);
					}
				} else if (EventEmitter.listenerCount(request, 'error') > 0) {
					request.emit('error', err);
				}
			});
		}
		
		if (err) {
			req.emit('error', err);
			return;
		}
		
		next();
	});
};