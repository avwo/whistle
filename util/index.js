var net = require('net');
var url = require('url');
var path = require('path');
var util = require('util');
var os = require('os');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var StringDecoder = require('string_decoder').StringDecoder;
var PassThrough = require('stream').PassThrough;
var iconv = require('iconv-lite');
var zlib = require('zlib');
var PipeStream = require('pipestream');
var config = require('../package.json');

exports.LOCAL_DATA_PATH = path.join(__dirname, '../../' + config.dataDirname);
exports.WhistleTransform = require('./whistle-transform');
exports.PROXY_ID = 'x-' + config.name + '-' + Date.now();
exports.HTTPS_FIELD = 'x-' + config.name + '-https-' + Date.now();

function noop() {}

exports.noop = noop;

exports.resolvePath = function(file) {
	if (!file || !(file = file.trim())) {
		return file;
	}
	
	return /^[\w-]+$/.test(file) ? file : path.resolve(file);
};

exports.mkdir = function mkdir(path) {
	!fs.existsSync(path) && fs.mkdirSync(path);
};

function formatDate(now) {
	now = now || new Date();
	var date = [now.getFullYear(), paddingLeft(now.getMonth() + 1), 
	            paddingLeft(now.getDate())].join('-');
	var time = [paddingLeft(now.getHours()), paddingLeft(now.getMinutes()), 
	            paddingLeft(now.getSeconds())].join(':')
	return date + ' ' + time;
}

function paddingLeft(num) {
	return num < 10 ? '0' + num : num;
}

exports.formatDate = formatDate;

var REG_EXP_RE = /^\/(.+)\/(i)?$/

exports.isRegExp = function isRegExp(regExp) {
	return REG_EXP_RE.test(regExp);
};

exports.emitError = function(obj, err) {
	if (obj) {
		obj.once('error', noop);
		obj.emit('error', err || new Error('unknown'));
	}
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

function removeProtocol(url, clear) {
	return hasProtocol(url) ? url.substring(url.indexOf('://') + (clear ? 3 : 1)) : url;
}

exports.hasProtocol = hasProtocol;
exports.setProtocol = setProtocol;
exports.getProtocol = getProtocol;
exports.removeProtocol = removeProtocol;

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
		var emitEndStream = new PassThrough();
		emitEndStream.on('data', noop);
		emitEndStream.on('end', end);
		stream.pipe(emitEndStream);
	} else {
		stream.on('data', noop);
	}
};

exports.encodeNonAsciiChar = function encodeNonAsciiChar(str) {
	
	return  str && str.replace(/[^\x00-\x7F]/g, safeEncodeURIComponent);
};

/**
 * 解析一些字符时，encodeURIComponent可能会抛异常，对这种字符不做任何处理
 * http://stackoverflow.com/questions/16868415/encodeuricomponent-throws-an-exception
 * @param ch
 * @returns
 */
function safeEncodeURIComponent(ch) {
	try {
		return encodeURIComponent(ch);
	} catch(e) {}
	
	return ch;
}

function getPath(url) {
	if (url) {
		url = url.replace(/\/?(?:\?|#).*$/, '');
		var index = url.indexOf('://');
		url = index > -1 ? url.substring(index + 3) : url;
	}
	
	return url;
}

exports.getPath = getPath;

function wrapResponse(res) {
	var passThrough = new PassThrough();
	passThrough.statusCode = res.statusCode;
	passThrough.headers = lowerCaseify(res.headers);
	passThrough.trailers = lowerCaseify(res.trailers);
	passThrough.headers.server = config.name;
	res.body != null && passThrough.push(String(res.body));
	passThrough.push(null);
	return passThrough;
}

exports.wrapResponse = wrapResponse;

exports.wrapGatewayError = function(body) {
	return wrapResponse({
		statusCode: 502,
		headers: {
			'content-type': 'text/plain'
		},
		body: body
	});
};

function parseJSON(data) {
	try {
		return JSON.parse(data);
	} catch(e) {}
	
	return null;
}

exports.parseJSON = parseJSON;

function lowerCaseify(obj) {
	var result = {};
	for (var i in obj) {
		result[i.toLowerCase()] = obj[i];
	}
	
	return result;
}

exports.lowerCaseify = lowerCaseify;

function parseFileToJson(path, callback) {
	if (!(path = getPath(path))) {
		callback();
		return;
	}
	fs.readFile(path, {encoding: 'utf8'}, function(err, data) {
		
		callback(err, (data = data && data.trim()) && parseJSON(data));
	});
}

exports.parseFileToJson = parseFileToJson;

function parseRuleToJson(rule, callback) {
	if (!rule) {
		callback();
		return;
	}
	
	if (rule.value) {
		callback(null, parseJSON(removeProtocol(rule.value, true)));
		return;
	}
	
	parseFileToJson(rule && (rule.path || rule.matcher), callback);
}

exports.parseRuleToJson = parseRuleToJson;

function getValue(rule) {
	return rule.value || rule.path;
}

exports.rule = {
		getMatcher: function getMatcher(rule) {
			return rule && (getValue(rule) || rule.matcher);
		},

		getUrl: function getUrl(rule) {
			return rule && (getValue(rule) || rule.url);
		}
};

function getContentType(contentType) {
	if (contentType && typeof contentType != 'string') {
		contentType = contentType['content-type'] || contentType.contentType;
	}
	
	if (typeof contentType == 'string') {
		contentType = contentType.toLowerCase();
		if (contentType.indexOf('javascript') != -1) {
	        return 'JS';
	    }
		
		if (contentType.indexOf('css') != -1) {
	        return 'CSS';
	    }
		
		if (contentType.indexOf('html') != -1) {
	        return 'HTML';
	    }
		
		if (contentType.indexOf('json') != -1) {
	        return 'JSON';
	    }
		
		if (contentType.indexOf('text/') != -1) {
	        return 'TEXT';
	    }
		
		if (contentType.indexOf('image') != -1) {
	        return 'IMG';
	    } 
	}
	
	return null;
}

exports.getContentType = getContentType;

function supportHtmlTransform(res) {
	var headers = res.headers;
	if (getContentType(headers) != 'HTML' || !hasBody(res)) {
		return false;
	}
	
	var contentEncoding = toLowerCase(headers && headers['content-encoding']);
	//chrome新增了sdch压缩算法，对此类响应无法解码
	return !contentEncoding || contentEncoding == 'gzip' || contentEncoding == 'deflate';
}

exports.supportHtmlTransform = supportHtmlTransform;

function hasBody(res) {
	var statusCode = res.statusCode;
	return !(statusCode == 204 || (statusCode >= 300 && statusCode < 400) ||
		      (100 <= statusCode && statusCode <= 199));
}

exports.hasBody = hasBody;

function hasRequestBody(req) {
	req = typeof req == 'string' ? req : req.method;
	if (typeof req != 'string') {
		return false;
	}
	
	req = req.toUpperCase();
	return !(req === 'GET' || req === 'HEAD' ||
		   req === 'DELETE' || req === 'OPTIONS' ||
		   req === 'CONNECT');
}

exports.hasRequestBody = hasRequestBody;

function getPipeZipStream(headers) {
	var pipeStream = new PipeStream();
	switch (toLowerCase(headers && headers['content-encoding'])) {
	    case 'gzip':
	    	pipeStream.addHead(zlib.createGunzip());
	    	pipeStream.addTail(zlib.createGzip());
	      break;
	    case 'deflate':
	    	pipeStream.addHead(zlib.createInflate());
	    	pipeStream.addTail(zlib.createDeflate());
	      break;
	}
	
	return pipeStream;
}

exports.getPipeZipStream = getPipeZipStream;

function getPipeIconvStream(headers, plainText) {
	var pipeStream = new PipeStream();
	var charset = plainText ? null : getCharset(headers['content-type']);
	
	if (charset) {
		pipeStream.addHead(iconv.decodeStream(charset));
		pipeStream.addTail(iconv.encodeStream(charset));
	} else {
		pipeStream.addHead(function(res, next) {
			var buffer, iconvDecoder;
			var decoder = new StringDecoder();
			var content = '';
			
			res.on('data', function(chunk) {
				buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
				if (!charset) {
					content += chunk ? decoder.write(chunk) : decoder.end();
					if (!plainText) {//如果没charset
						charset = getMetaCharset(content);
					}
				} 
				resolveCharset(buffer);
			});
			res.on('end', resolveCharset);
			
			function resolveCharset(chunk) {
				if (!charset && (!chunk || content.length >= 204800)) {
					charset = content.indexOf('�') != -1 ? 'gbk' : 'utf8';
					content = null;
				}
				
				if (!charset) {
					return;
				}
				
				if (!iconvDecoder) {
					iconvDecoder = iconv.decodeStream(charset);
					next(iconvDecoder);
				}
				
				if (buffer) {
					iconvDecoder.write(buffer);
					buffer = null;
				}
				
				!chunk && iconvDecoder.end();
			}
			
		});
		
		pipeStream.addTail(function(src, next) {
			next(src.pipe(iconv.encodeStream(charset)));
		});
	}

	return pipeStream;
}

exports.getPipeIconvStream = getPipeIconvStream;

function toLowerCase(str) {
	return str && str.trim().toLowerCase();
}

exports.toLowerCase = toLowerCase;

var CHARSET_RE = /charset=([\w-]+)/i;
var META_CHARSET_RE = /<meta\s[^>]*\bcharset=(?:'|")?([\w-]+)[^>]*>/i;

function getCharset(str, isMeta) {
	
	return _getCharset(str);
}

function getMetaCharset(str) {
	
	return _getCharset(str, true);
}

function _getCharset(str, isMeta) {
	var charset;
	if ((isMeta ? META_CHARSET_RE : CHARSET_RE).test(str)) {
		charset = RegExp.$1;
		if (!iconv.encodingExists(charset)) {
			charset = null;
		}
	}
	
	return charset;
}

exports.getCharset = getCharset;
exports.getMetaCharset = getMetaCharset;

function getClientIp(req, forwarded) {
	var ip;
	try {
		ip = forwarded && req.headers['x-forwarded-for'] ||
	    req.connection.remoteAddress ||
	    req.socket.remoteAddress;
	} catch(e) {}
	
	return ip;
}

exports.getClientIp = getClientIp;

