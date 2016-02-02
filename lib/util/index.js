var net = require('net');
var url = require('url');
var path = require('path');
var util = require('util');
var os = require('os');
var fs = require('fs');
var vm = require('vm');
var fse = require('fs-extra');
var qs = require('querystring');
var EventEmitter = require('events').EventEmitter;
var StringDecoder = require('string_decoder').StringDecoder;
var PassThrough = require('stream').PassThrough;
var iconv = require('iconv-lite');
var zlib = require('zlib');
var PipeStream = require('pipestream');
var Q = require('q');
var config = require('../config');
var fileWriterCache = {};
var VM_OPTIONS = {
		displayErrors: false,
		timeout: 100
	};

exports.WhistleTransform = require('./whistle-transform');
exports.ReplacePatternTransform = require('./replace-pattern-transform');
exports.ReplaceStringTransform = require('./replace-string-transform');
exports.SpeedTransform = require('./speed-transform');
exports.FileWriterTransform = require('./file-writer-transform');
exports.MultiPartParser = require('./multipart-parser');
exports.connectHttp = require('./connect-http');
exports.connectSocks = require('./connect-socks');
exports.connect = function(options, callback) {
	return exports[options.isSocks ? 'connectSocks' : 'connectHttp'](options, callback);
};
exports.parseReq = require('./parse-req');

function noop() {}

exports.noop = noop;

function changePort(url, port) {
	var index = url.indexOf('/', url.indexOf('://') + 3);
	if (index != -1) {
		var host = url.substring(0, index).replace(/:\d*$/, '');
		url = host + ':' + port + url.substring(index);
	}
	return url;
}

exports.changePort = changePort;

function execScriptSync(script, context) {
	try {
		vm.runInNewContext(script, context, VM_OPTIONS);
		return true;
	} catch(e) {}
}

exports.execScriptSync = execScriptSync;

function toMultipart(name, value) {
	if (value == null) {
		value = '';
	}
	if (typeof value == 'object') {
		var filename = value.filename == null ? '' : value.filename + '';
		value = value.content || '';
		return new Buffer('Content-Disposition: form-data; name="' + name + '"; filename="' + filename
						+ '"\r\nContent-Type: application/octet-stream\r\n\r\n' + value);
	}
	return new Buffer('Content-Disposition: form-data; name="' + name + '"\r\n\r\n' + value);
}

exports.toMultipart = toMultipart;

function toMultiparts(params, boundary) {
	var content = Object.keys(params).map(function(name) {
		return boundary + '\r\n' + toMultipart(name, params[name]);
	}).join('\r\n');
	return new Buffer(content ? '\r\n' + content : '');
}

exports.toMultiparts = toMultiparts;

function getFileWriter(file, callback) {
	if (!file || fileWriterCache[file]) {
		return callback();
	}
	
	var execCallback = function(writer) {
		delete fileWriterCache[file];
		callback(writer);
	};
	
	fs.stat(file, function(err, stat) {
		if (!err) {
			return execCallback();
		}
		
		fse.ensureFile(file, function(err) {
			execCallback(err ? null : fs.createWriteStream(file).on('error', noop));
		});
	});
}

exports.getFileWriter = getFileWriter;

function getFileWriters(files, callback) {
	if (!Array.isArray(files)) {
		files = [files];
	}
	
	Q.all(files.map(function(file) {
		var defer = Q.defer();
		getFileWriter(file, function(writer) {
			defer.resolve(writer);
		});
		return defer.promise;
	})).spread(callback); 
}

exports.getFileWriters = getFileWriters;

function clone(obj) {
	if (!obj || typeof obj != 'object') {
		return obj;
	}
	
	var result = Array.isArray(obj) ? [] : {};
	Object.keys(obj).forEach(function(name) {
		result[name] = clone(obj[name]);
	});
	
	return result;
}

exports.clone = clone;

function toBuffer(buf) {
	if (buf == null || buf instanceof Buffer) {
		return buf;
	}
	
	return new Buffer(buf + '');
}

exports.toBuffer = toBuffer;

exports.mkdir = function mkdir(path) {
	!fs.existsSync(path) && fs.mkdirSync(path);
	return path;
};

function getErrorStack(err) {
	if (!err) {
		return '';
	}
	
	var stack;
	try {
		stack = err.stack;
	} catch(e) {}
	
	return 'Date: ' + formatDate() + '\r\n' + (stack || err.message || err);
}

exports.getErrorStack = getErrorStack;

function formatDate(now) {
	now = now || new Date();
	var date = [now.getFullYear(), paddingLeft(now.getMonth() + 1), 
	            paddingLeft(now.getDate())].join('-');
	var time = [paddingLeft(now.getHours()), paddingLeft(now.getMinutes()), 
	            paddingLeft(now.getSeconds())].join(':')
	return date + ' ' + time + '.' + (now % 1000);
}

function paddingLeft(num) {
	return num < 10 ? '0' + num : num;
}

exports.formatDate = formatDate;

var REG_EXP_RE = /^\/(.+)\/(i)?$/

exports.isRegExp = function isRegExp(regExp) {
	return REG_EXP_RE.test(regExp);
};

var ORIG_REG_EXP = /^\/(.+)\/([igm]{0,3})$/;

exports.isOriginalRegExp = function isOriginalRegExp(regExp) {
	if (!ORIG_REG_EXP.test(regExp) || /[igm]{2}/.test(regExp.$2)) {
		return false;
	}
	
	return true;
};

exports.toOriginalRegExp = function toRegExp(regExp) {
	regExp = ORIG_REG_EXP.test(regExp);
	try {
		regExp = regExp && new RegExp(RegExp.$1, RegExp.$2);
	} catch(e) {
		regExp = null;
	}
	return regExp;
};

exports.emitError = function(obj, err) {
	if (obj) {
		obj.once('error', noop);
		obj.emit('error', err || new Error('unknown'));
	}
};

exports.indexOfList = function(buf, subBuf, start) {
	start = start || 0;
	if (buf.indexOf) {
		return buf.indexOf(subBuf, start);
	}
	
	var subLen = subBuf.length;
	if (subLen) {
		for (var i = start, len = buf.length - subLen; i <= len; i++) {
			var j = 0;
			for (; j < subLen; j++) {
				if (subBuf[j] !== buf[i + j]) {
					break;
				}
			}
			if (j == subLen) {
				return i;
			}
		}
	}
	
	return -1;
};

exports.startWithList = function(buf, subBuf, start) {
	var len = subBuf.length;
	if (!len) {
		return false;
	}
	
	start = start || 0;
	for (var i = 0; i < len; i++) {
		if (buf[i + start] != subBuf[i]) {
			return false;
		}
	}
	
	return true;
};

exports.endWithList = function(buf, subBuf, end) {
	var subLen = subBuf.length;
	if (!subLen) {
		return false;
	}
	if (!(end >= 0)) {
		end = buf.length - 1;
	}
	
	for (var i = 0; i < subLen; i++) {
		if (subBuf[subLen - i - 1] != buf[end - i]) {
			return false;
		}
	}
	
	return true;
};

exports.getHost = function parseHost(_url) {
	_url = url.parse(setProtocol(_url || '')).hostname;
	return _url && _url.toLowerCase();
};

exports.setTimeout = function(callback) {
	var timeout = parseInt(config.timeout, 10);
	return setTimeout(callback, timeout > 0 ? timeout : 36000);
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
	var host = req.headers.host;
	if (host) {
		host = req.isHttps ? host.replace(/:443$/, '') : host.replace(/:80$/, '');
	}
	return _getProtocol(req.isHttps) + host + req.url;
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

function replaceProtocol(url, protocol) {
	
	return (protocol || 'http:') +  removeProtocol(url);
}

exports.hasProtocol = hasProtocol;
exports.setProtocol = setProtocol;
exports.getProtocol = getProtocol;
exports.removeProtocol = removeProtocol;
exports.replaceProtocol = replaceProtocol;

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

exports.isWebsocketProtocol = function isWebsocketProtocol(protocol) {
	return protocol == 'ws:' || protocol == 'wss:';
};

function isProxyProtocol(protocol) {
	return protocol == 'proxy:' || protocol == 'http-proxy:' || protocol == 'socks:';
}

exports.isProxyProtocol = isProxyProtocol;

exports.drain = function drain(stream, end) {
	var emitEndStream = new PassThrough();
	emitEndStream.on('data', noop)
		.on('error', noop);
	typeof end == 'function' && emitEndStream.on('end', end);
	stream.pipe(emitEndStream);
};

exports.encodeNonAsciiChar = function encodeNonAsciiChar(str) {
	if (!str || typeof str != 'string') {
		return '';
	}
	
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

exports.encodeURIComponent = safeEncodeURIComponent;

function getPath(url, noProtocol) {
	if (url) {
		url = url.replace(/\/?[?#].*$/, '');
		var index = noProtocol ? -1 : url.indexOf('://');
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

function parseInlineJSON(text, isValue) {
	if (!text || typeof text != 'string' || /\s/.test(text) 
			|| (!isValue && (/\\|\//.test(text) && !/^&/.test(text)))) {
		return;
	}
	
	return qs.parse(text);
}

function parseLinesJSON(text) {
	if (!text || typeof text != 'string' 
		|| !(text = text.trim()) || /^[\{\[]/.test(text)) {
		return null;
	}
	var obj = {};
	text.split(/\r\n|\n|\r/g).forEach(function(line) {
		if (line = line.trim()) {
			var index = line.indexOf(': ');
			if (index != -1) {
				var name = line.substring(0, index).trim();
				obj[name] = line.substring(index + 2).trim();
			} else {
				obj[line.trim()] = '';
			}
		}
	});
	return obj;
}

function parseJSON(data) {
	
	return _parseJSON(data, true) || parseLinesJSON(data);
}

function _parseJSON(data, isValue) {
	if (typeof data != 'string' || !(data = data.trim())) {
		return null;
	}
	
	try {
		return JSON.parse(data);
	} catch(e) {}
	
	return parseInlineJSON(data, isValue);
}

exports.parseJSON = parseJSON;

function readFiles(files, callback) { 
	if (!Array.isArray(files)) {
		files = [files];
	}
	
	Q.all(files.map(function(file) {
		var defer = Q.defer();
		if (file && typeof file == 'string') {
			fs.readFile(file, {encoding: 'utf8'}, function(err, data) {
				defer.resolve(err ? null : data);
			});
		} else {
			defer.resolve();
		}
		return defer.promise;
	})).spread(callback); 
}

exports.readFiles = readFiles;

function readInjectFiles(data, callback) {
	if (!data) {
		return callback();
	}
	
	readFiles([data.prepend, data.replace, data.append], function(top, body, bottom) {
		if (top != null) {
			data.top = top;
		} 
		if (body != null) {
			data.body = body;
		}
		if (bottom != null) {
			data.bottom = bottom;
		}
		callback(data);
	});
}

exports.readInjectFiles = readInjectFiles;

function lowerCaseify(obj) {
	var result = {};
	for (var i in obj) {
		if (obj[i] !== undefined) {
			result[i.toLowerCase()] = obj[i];
		}
	}
	
	return result;
}

exports.lowerCaseify = lowerCaseify;

function parseRuleJson(rules, callback) {
	if (!Array.isArray(rules)) {
		rules = [rules];
	}

	Q.all(rules.map(function(rule) {
		var defer = Q.defer();
		var json = _parseJSON(rule && removeProtocol(getMatcher(rule), true));
		if (json) {
			defer.resolve(json);
		} else {
			_getRuleValue(rule, function(data) {
				defer.resolve(parseJSON(data));
			});
		}
		return defer.promise;
	})).spread(callback); 
}

exports.parseRuleJson = parseRuleJson;

function _getRuleValue(rule, callback) {
	if (!rule) {
		return callback();
	}
	if (rule.value) {
		return callback(removeProtocol(rule.value, true));
	}
	
	fs.readFile(getPath(getMatcher(rule)), {encoding: 'utf8'}, function(err, data) {
		callback(err ? null : data);
	});
}

function getRuleValue(rules, callback) {
	if (!Array.isArray(rules)) {
		rules = [rules];
	}
	
	Q.all(rules.map(function(rule) {
		var defer = Q.defer();
		_getRuleValue(rule, function(data) {
			defer.resolve(data);
		});
		return defer.promise;
	})).spread(callback); 
}

exports.getRuleValue = getRuleValue;

function decodePath(path) {
	path = getPath(path, true);
	try {
		return decodeURIComponent(path);
	 } catch (e) {}
	 
	 try {
		 return qs.unescape(path);
	 } catch(e) {}
	 
	return path;
}

function getRuleFiles(rule) {
	var files = rule.files || [getPath(getUrl(rule))];
	return files.map(function(file) {
		return decodePath(file);
	});
}

exports.getRuleFiles = getRuleFiles;

function getRuleFile(rule) {
	rule = getPath(getUrl(rule));
	return rule ? decodePath(rule) : rule;
}

exports.getRuleFile = getRuleFile;

function getValue(rule) {
	return rule.value || rule.path;
}

function getMatcher(rule) {
	return rule && (getValue(rule) || rule.matcher);
}

function getUrl(rule) {
	return rule && (getValue(rule) || rule.url);
}

exports.rule = {
		getMatcher: getMatcher,
		getUrl: getUrl,
		getProxy: function getProxy(rule) {
			var proxyUrl = getMatcher(rule);
			return isProxyProtocol(getProtocol(proxyUrl)) ? proxyUrl : null;
		}
};

function getMatcherValue(rule) {
	rule = getMatcher(rule);
	return rule && removeProtocol(rule, true);
}

exports.getMatcherValue = getMatcherValue;

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
		
		if (contentType.indexOf('xml') != -1) {
	        return 'XML';
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
	//chrome新增了sdch压缩算法，对此类响应无法解码，deflate无法区分deflate还是deflateRaw
	return !contentEncoding || contentEncoding == 'gzip';
}

exports.supportHtmlTransform = supportHtmlTransform;

function removeUnsupportsHeaders(headers, supportsDeflate) {//只保留支持的zip格式：gzip、deflate
	if (!headers || !headers['accept-encoding']) {
		return;
	}
	var list = headers['accept-encoding'].split(/\s*,\s*/g);
	var acceptEncoding = [];
	for (var i = 0, len = list.length; i < len; i++) {
		var ae = list[i].toLowerCase();
		if (ae && (supportsDeflate && ae == 'deflate' || ae == 'gzip')) {
			acceptEncoding.push(ae);
		}
	}
	
	if (acceptEncoding = acceptEncoding.join(', ')) {
		headers['accept-encoding'] = acceptEncoding;
	} else {
		delete headers['accept-encoding'];
	}
}

exports.removeUnsupportsHeaders = removeUnsupportsHeaders;

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

function isEmptyObject(obj) {
	
	return !obj || !Object.keys(obj).length;
}

exports.isEmptyObject = isEmptyObject;

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
				if (!charset && (!chunk || content.length >= 51200)) {
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
	return typeof str == 'string' ?  str.trim().toLowerCase() : str;
}

exports.toLowerCase = toLowerCase;

function toUpperCase(str) {
	return typeof str == 'string' ?  str.trim().toUpperCase() : str;
}

exports.toUpperCase = toUpperCase;

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
	var headers = req.headers || {};
	try {
		ip = (forwarded && headers['x-forwarded-for']) 
				|| headers[config.CLIENT_IP_HEAD]
					|| req.connection.remoteAddress 
						|| req.socket.remoteAddress;
	} catch(e) {}
	
	return removeIPV6Prefix(ip);
}

exports.getClientIp = getClientIp;

function removeIPV6Prefix(ip) {
	if (typeof ip != 'string') {
		return ip;
	}
	
	return ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
}

exports.removeIPV6Prefix = removeIPV6Prefix;

function getAuths(_url) {
	var auths = [];
	var options = typeof _url == 'string' ? url.parse(_url) : _url;
	if (!options || !options.auth) {
		return auths;
	}
	
	options.auth.split('|').forEach(function(auth) {
		if (auth = auth.trim()) {
			var index = auth.indexOf(':');
			auths.push({
				username: index == -1 ? auth : auth.substring(0, index),
				password: index == -1 ? '' : auth.substring(index + 1)
			});
		}
	});
	
	return auths;
}

exports.getAuths = getAuths;

function isUrlEncoded(req) {
	
	return /^post$/i.test(req.method) && /urlencoded/i.test(req.headers && req.headers['content-type']);
}

exports.isUrlEncoded = isUrlEncoded;

function isMultipart(req) {
	return /^post$/i.test(req.method) && /multipart/i.test(req.headers['content-type']);
}

exports.isMultipart = isMultipart;

function getQueryString(url) {
	var index = url.indexOf('?');
	return index == -1 ? '' : url.substring(index + 1);
}

exports.getQueryString = getQueryString;

function replaceQueryString(query, replaceQuery) {
	if (replaceQuery && typeof replaceQuery != 'string') {
		replaceQuery = qs.stringify(replaceQuery);
	}
	if (!query || !replaceQuery) {
		return query || replaceQuery;
	}
	
	var queryList = [];
	var params = {};
	
	query = query.split('&').map(filterName);
	replaceQuery = replaceQuery.split('&').map(filterName);
	query.concat(replaceQuery).forEach(function(name) {
		if (name) {
			var value = params[name];
			queryList.push(name + (value == null ? '' : '=' + value));
		}
	});
	
	function filterName(param) {
		var index = param.indexOf('=');
		var name, value;
		if (index == -1) {
			name = param;
			value = null;
		} else {
			name = param.substring(0, index);
			value = param.substring(index + 1);
		}
		
		var exists = name in params;
		params[name] = value;
		return exists ? null : name;
	}
	
	return queryList.join('&');
}

exports.replaceQueryString = replaceQueryString;

function replaceUrlQueryString(url, queryString) {
	if (!queryString) {
		return url;
	}
	url = url || '';
	var hashIndex = url.indexOf('#');
	var hashString = '';
	if (hashIndex != -1) {
		hashString = url.substring(hashIndex);
		url = url.substring(0, hashIndex);
	} 
	queryString = replaceQueryString(getQueryString(url), queryString);
	
	return url.replace(/\?.*$/, '') + (queryString ? '?' +  queryString : '') + hashString;
}

exports.replaceUrlQueryString = replaceUrlQueryString;

function isEmptyObject(obj) {
	for (var i in obj) {
		return false;
	}
	return true;
}

exports.isEmptyObject = isEmptyObject;

function decodeBuffer(buffer) {
	if (!buffer) {
		return '';
	}
	
	var text = buffer + '';
	return text.indexOf('�') == -1 ? text : iconv.decode(buffer, 'GB18030');
}

exports.decodeBuffer = decodeBuffer;

function setHeaders(data, obj) {
	data.headers = data.headers || {};
	for (var i in obj) {
		data.headers[i] = obj[i];
	}
	return data;
}

exports.setHeaders = setHeaders;

function setHeader(data, name, value) {
	data.headers = data.headers || {};
	data.headers[name] = value;
	return data;
}

exports.setHeader = setHeader;


