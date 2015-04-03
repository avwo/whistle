var net = require('net');
var url = require('url');
var path = require('path');
var os = require('os');
var PassThrough = require('stream').PassThrough;
var iconv = require('iconv-lite');
var zlib = require('zlib');
var config = require('../package.json');

function noop() {}

exports.noop = noop;

var REG_EXP_RE = /^\/(.+)\/(i)?$/

exports.isRegExp = function isRegExp(regExp) {
	return REG_EXP_RE.test(regExp);
};


exports.getHost = function parseHost(_url) {
	_url = url.parse(setProtocol(_url || '')).hostname;
	return _url && _url.toLowerCase();
};


exports.toRegExp = function toRegExp(regExp) {
	regExp = REG_EXP_RE.test(regExp);
	try {
		regExp = regExp && new RegExp(RegExp.$1, RegExp.$2);
	} catch(e) {
		regExp = null;
	}
	return regExp;
};

exports.getFullUrl = function getFullUrl(req) {
	if (hasProtocol(req.url)) {
		req.url = url.parse(req.url).path;
	}
	return _getProtocol(req.isHttps) + req.headers.host + req.url;
};

function setProtocol(url, isHttps) {
	return hasProtocol(url) ? url : _getProtocol(isHttps) + url;
}

function _getProtocol(isHttps) {
	return isHttps ? 'https://' : 'http://';
}

function hasProtocol(url) {
	return /^[a-z0-9.+-]+:\/\//i.test(url);
}

function getProtocol(url) {
	return hasProtocol(url) ? url.substring(0, url.indexOf('://') + 1) : null;
}

function removeProtocol(url) {
	return hasProtocol(url) ? url.substring(url.indexOf('://') + 3) : url;
}

exports.hasProtocol = hasProtocol;
exports.setProtocol = setProtocol;
exports.getProtocol = getProtocol;
exports.removeProtocol = removeProtocol;

function toWhistleSsl(req, _url) {
	if (!req.isHttps || !hasProtocol(_url)) {
		return _url;
	}
	var options = url.parse(_url);
	if (options.protocol = 'https:') {
		options.protocol = 'http:';
		addWhistleSsl(options, 'hostname');
		addWhistleSsl(options, 'host')
	}
	
	return url.format(options);
}

function addWhistleSsl(options, name) {
	if (options[name]) {
		options[name] = config.whistleSsl + '.' + options[name];
	}
}

exports.toWhistleSsl = toWhistleSsl;

exports.isLocalAddress = function(address) {
	if (!address) {
		return false;
	}
	
	if (address == '127.0.0.1' || address == '0:0:0:0:0:0:0:1') {
		return true;
	}
	
	address = address.toLowerCase();
	var interfaces = os.networkInterfaces();
	for (var i in interfaces) {
		var list = interfaces[i];
		if (Array.isArray(list)) {
			for (var j = 0, info; info = list[j]; j++) {
				if (info.address.toLowerCase() == address) {
					return true;
				}
			}
		}
	}
	
	return false;
};

exports.isWebProtocol = function isWebProtocol(protocol) {
	return protocol == 'http:' || protocol == 'https:';
};


exports.drain = function drain(stream, end) {
	if (end) {
		stream._readableState.endEmitted ? end.call(stream) : stream.on('end', end);
	}
	stream.on('data', noop);
};

exports.encodeNonAsciiChar = function encodeNonAsciiChar(str) {
	
	return  str ? str.replace(/[^\x00-\x7F]/g, encodeURIComponent) : str;
};

exports.getPath = function getPath(url) {
	url = url && url.replace(/\/?(?:\?|#).*$/, '') || '';
	var index = url.indexOf('://');
	return index > -1 ? url.substring(index + 3) : url;
};

exports.wrapResponse = function wrapResponse(res) {
	var passThrough = new PassThrough();
	passThrough.statusCode = res.statusCode;
	passThrough.headers = res.headers || {};
	passThrough.headers.Server = config.name;
	passThrough.push(res.body == null ? null : String(res.body));
	return passThrough;
};

exports.parseJSON = function parseJSON(data) {
	try {
		return JSON.parse(data);
	} catch(e) {}
	
	return null;
}

function getContentType(contentType) {
	if (contentType && typeof (contentType = contentType['content-type'] ||
			contentType.contentType || contentType) == 'string') {
		
		contentType = contentType.toLowerCase();
		if (contentType.indexOf('javascript') >= 0) {
	        return 'JS';
	    }
		
		if (contentType.indexOf('css') >= 0) {
	        return 'CSS';
	    }
		
		if (contentType.indexOf('html') >= 0) {
	        return 'HTML';
	    }
		
		if (contentType.indexOf('json') >= 0) {
	        return 'JSON';
	    }
		
		if (contentType.indexOf('image') >= 0) {
	        return 'IMG';
	    } 
	}
	
	return '';
}

exports.getContentType = getContentType;

var CHARSET_RE = /charset=([\w-]+)/i;
exports.transform = function(res, out, transform, cb) {
	var headers = res.headers || {};
	var type = getContentType(headers);
	
	if (!transform || !type || type == 'IMG') {
		cb && cb(false);
		return false;
	}
	
	var cacheData, charset;
	
	if (CHARSET_RE.test(headers['content-type'])) {
		charset = RegExp.$1;
		if (!iconv.encodingExists(charset)) {
			return res.pipe(out);
		}
		
		
	}
	
	function transformText(charset) {
		
	}
	
	return out;
};

function transformUnzip(res, out, transform) {
	var unzip, zip;
	var contentEncoding = res.headers && res.headers['content-encoding'];
	switch (contentEncoding) {
	    case 'gzip':
	    	unzip = zlib.createGunzip();
	    	zip = zlib.createGzip();
	      break;
	    case 'deflate':
	    	unzip = zlib.createInflate();
	    	zip = zlib.createDeflate();
	      break;
	}
	
	if (contentEncoding && !unzip || !transform) {
		return false;
	}
	
	if (unzip) {
		res = res.pipe(unzip).on('error', emitError.bind(out));
		zip.on('error', emitError.bind(out)).pipe(out);
		out = zip;
	}
	
	var ended;
	var afterTransform = function(data) {
		out.write(data);
		if (ended) {
			out.end();
		}
	};
	
	res.on('data', function(data) {
		transform(data, afterTransform);
	}).on('end', function() {
		ended = true;
		transform(null, afterTransform);
	});
	
	return true;
}

function emitError(err) {
	this.emit('error', err);
}



