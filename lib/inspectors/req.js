var qs = require('querystring');
var iconv = require('iconv-lite');
var util = require('../util');
var extend = require('util')._extend;
var Transform = require('pipestream').Transform;
var WhistleTransform = util.WhistleTransform;
var ReplacePatternTransform = util.ReplacePatternTransform;
var ReplaceStringTransform = util.ReplaceStringTransform;
var FileWriterTransform = util.FileWriterTransform;
var MultiPartParser = util.MultiPartParser;
var MAX_REQ_SIZE = 256 * 1024;
var REQ_TYPE = {
		urlencoded: 'application/x-www-form-urlencoded',
		form: 'application/x-www-form-urlencoded',
		json: 'application/json',
		xml: 'text/xml', 
		text: 'text/plain',
		upload: 'multipart/form-data',
		multipart: 'multipart/form-data',
		defaultType: 'application/octet-stream'
};

/**
 * 处理请求数据
 * 
 * @param req：method、body、headers，top，bottom，speed、delay，charset,timeout
 * @param data
 */
function handleReq(req, data) {
	req.method = data.method || req.method;
	req.timeout = parseInt(data.timeout, 10);
	extend(req.headers, data.headers);
	if (typeof data.charset == 'string') {
		var type = req.headers['content-type'];
		var charset = '; charset=' + data.charset;
		if (typeof type == 'string') {
			req.headers['content-type'] = type.split(';')[0] + charset;
		} else {
			req.headers['content-type'] = charset;
		}
	} else {
		delete data.charset;
	}
	var method = req.method = typeof req.method != 'string' ? 'GET' : req.method.toUpperCase();
	if (!util.hasRequestBody(method)) {
		delete data.top;
		delete data.bottom;
		delete data.body;
	} else if (data.top || data.bottom || data.body) {
		delete req.headers['content-length'];
	}
	
	!util.isEmptyObject(data) && req.add(new WhistleTransform(data));
}

function handleCors(data, cors) {
	if (!cors) {
		return;
	}

	if (cors.origin !== undefined) {
		util.setHeader(data, 'origin', cors.origin);
	}
	
	if (cors.method !== undefined) {
		util.setHeader(data, 'access-control-request-method', cors.method);
	}

	if (cors.headers !== undefined) {
		util.setHeader(data, 'access-control-request-headers', cors.headers);
	}
}

function handleAuth(data, auth) {
	if (!auth) {
		return;
	}

	var basic = [];
	auth.username != null && basic.push(auth.username);
	auth.password != null && basic.push(auth.password);
	if (basic = basic.join(':')) {
		util.setHeader(data, 'authorization', 'Basic ' + new Buffer(basic).toString('base64'));
	}
}

function handleCookies(data, cookies, curCookies) {
	var list = cookies && Object.keys(cookies);
	if (list && list.length) {
		var result = {};
		if (curCookies && typeof curCookies == 'string') {
			curCookies.split(/;\s*/g)
					.forEach(function(cookie) {
						var index = cookie.indexOf('=');
						if (index == -1) {
							result[cookie] = null;
						} else {
							result[cookie.substring(0, index)] = cookie.substring(index + 1);
						}
					});
		}
		
		list.forEach(function(name) {
			var value = cookies[name];
			value = value && typeof value == 'object' ? value.value : value;
			result[util.encodeURIComponent(name)] = value ? util.encodeURIComponent(value) : value;
		});
		
		cookies = Object.keys(result).map(function(name) {
			var value = result[name];
			return name + (value == null ? '' : '=' + value);
		}).join('; ');
		util.setHeader(data, 'cookie', cookies);
	}
}

function handleParams(req, params) {
	var _params = params;
	if (!(params = params && qs.stringify(params))) {
		return;
	}

	if (!req.method || /^GET$/i.test(req.method)) {
		req.options.search = util.replaceUrlQueryString(req.options.search, params);
		req.options.path = util.replaceUrlQueryString(req.options.path, params);
		req.options.href = util.replaceUrlQueryString(req.options.href, params);
	} else if (util.isUrlEncoded(req)) {
		delete req.headers['content-length'];
		var transform = new Transform();
		var buffer, interrupt;
		transform._transform = function(chunk, encoding, callback) {
			if (chunk) {
				if (!interrupt) {
					buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
					chunk = null;
					if (buffer.length > MAX_REQ_SIZE) {
						interrupt = true;
						chunk = buffer;
						buffer = null;
					}
				}
			} else if (buffer) {
				var body = buffer + '';
				var isGBK = body.indexOf('�') == -1;
				if (isGBK) {
					body = iconv.decode(buffer, 'GB18030');
					body = util.replaceQueryString(body, params);
					chunk = iconv.encode(body, 'GB18030');
				} else {
					chunk = new Buffer(body);
				}
				buffer = null;
			} else {
				chunk = new Buffer(params);
			}
			
			callback(null, chunk);
		};
		req.add(transform);
	} else if (util.isMultipart(req) && 
			/boundary=(?:"([^"]+)"|([^;]+))/i.test(req.headers['content-type'])) {
		delete req.headers['content-length'];
		var boundaryStr = '--' + (RegExp.$1 || RegExp.$2);
		var startBoundary = new Buffer(boundaryStr + '\r\n');
		var boundary = new Buffer('\r\n' + boundaryStr);
		var sepBoundary = new Buffer('\r\n' + boundaryStr + '\r\n');
		var endBoudary = new Buffer('\r\n' + boundaryStr + '--'); 
		var length = startBoundary.length;
		var sepLength = sepBoundary.length;
		var transform = new Transform();
		
		transform.parse = function(chunk) {
			var index, result, sep, data;
			while((index = util.indexOfList(chunk, boundary)) != -1 
						&& ((sep = util.startWithList(chunk, sepBoundary, index)) 
								|| util.startWithList(chunk, endBoudary, index))) {
				data = this.parser.transform(chunk.slice(0, index));
				result = result && data ? Buffer.concat([result, data]) : (result || data);
				if (!sep) {
					data = util.toMultiparts(_params, boundaryStr);
					result = result ? Buffer.concat([result, data]) : data;
				}
				sep = sep ? sepBoundary : endBoudary;
				result = result ? Buffer.concat([result, sep]) : sep;
				chunk = chunk.slice(index + sepLength);
				this.parser = new MultiPartParser(_params);
			}
			
			var len = chunk.length;
			if (len >= sepLength) {
				var lastIndex = len - sepLength + 1;
				data = this.parser.transform(chunk.slice(0, lastIndex));
				chunk = chunk.slice(lastIndex);
				result = result && data ? Buffer.concat([result, data]) : (result || data);
			}
			this.buffer = chunk;
			
			return result;
		};
		transform._transform = function(chunk, encoding, callback) {
			if (this.badMultipart) {
				return callback(null, chunk);
			}
			
			var end;
			if (chunk) {
				chunk = this.buffer ? Buffer.concat([this.buffer, chunk]) : chunk;
			} else {
				end = true;
				chunk = this.buffer;
			}
			
			if (chunk) {
				this.buffer = null;
				if (!this.parser) {
					if (util.startWithList(chunk, startBoundary)) {
						this.parser = new MultiPartParser(_params);
						chunk = this.parse(chunk.slice(length));
						chunk = chunk ? Buffer.concat([startBoundary, chunk]) : startBoundary;
					} else if(end || chunk.length >= length) {
						this.badMultipart = true;
					} else {
						this.buffer = chunk;
						chunk = null;
					}
				} else {
					chunk = this.parse(chunk);
				}
			}
			
			if (end && this.buffer) {
				chunk = chunk ? Buffer.concat([chunk, this.buffer]) : this.buffer;
			}
			callback(null, chunk);
		};
		req.add(transform);
	}
}

function removeDisableProps(req) {
	var disable = req.disable;
	var headers = req.headers;
	
	if (disable.ua) {
		delete headers['user-agent'];
	}
	
	if (disable.cookie || disable.cookies || 
			disable.reqCookie || disable.reqCookies) {
		delete headers.cookie;
	}
	
	if (disable.referer) {
		delete headers.referer;
	}
	
	if (disable.ajax) {
		delete headers['x-requested-with'];
	}
	
	if (disable.cache) {
		util.disableReqCache(headers);
	}
}

function handleReplace(req, replacement) {
	if (!util.hasRequestBody(req) || !replacement) {
		return;
	}
	
	var type = req.headers['content-type'];
	type = util.isUrlEncoded(req) ? 'FORM' : util.getContentType(type);
	if (!type || type == 'IMG') {
		return;
	}
	
	Object.keys(replacement).forEach(function(pattern) {
		var value = replacement[pattern];
		if (util.isOriginalRegExp(pattern) && (pattern = util.toOriginalRegExp(pattern))) {
			req.addTextTransform(new ReplacePatternTransform(pattern, value));
		} else if (pattern) {
			req.addTextTransform(new ReplaceStringTransform(pattern, value));
		}
	});
}

module.exports = function(req, res, next) {
	var reqRules = req.rules;
	var authObj;
	if (reqRules.auth) {
		authObj = util.getMatcherValue(reqRules.auth);
		if (/[{}\\\/]/.test(authObj)) {
			authObj = null;
		} else {
			var index = authObj.indexOf(':');
			authObj = {
					username: index == -1 ? authObj : authObj.substring(0, index),
					password: index == -1 ? null : authObj.substring(index + 1),
			};
		}
	}
	util.parseRuleJson([reqRules.req, reqRules.reqHeaders, reqRules.reqCookies, 
	                    authObj ? null : reqRules.auth, reqRules.params, reqRules.reqCors, reqRules.reqReplace], 
			function(data, headers, cookies, auth, params, cors, replacement) {
		if (reqRules.head && reqRules.head.req) {
			data = extend(reqRules.head.req, data);
		}
		data = data || {};
		if (headers) {
			data.headers =  extend(data.headers || {}, headers);
		}
		
		if (data.headers) {
			data.headers = util.lowerCaseify(data.headers);
		}
		
		if (reqRules.method) {
			var method = util.getMatcherValue(reqRules.method);
			data.method = method;
		}
		
		if (reqRules.reqType) {
			var newType = util.getMatcherValue(reqRules.reqType).split(';');
			var type = newType[0];
			newType[0] = (!type || type.indexOf('/') != -1) ? type : (REQ_TYPE[type] || REQ_TYPE.defaultType);
			type = newType.join(';');
			if (type.indexOf(';') == -1) {
				var origType = req.headers['content-type'];
				if (typeof origType == 'string' && origType.indexOf(';') != -1) {
					origType = origType.split(';');
					origType[0] = type;
					type = origType.join(';');
				}
			}
			util.setHeader(data, 'content-type', type);
		}
		
		if (reqRules.reqCharset) {
			data.charset = util.getMatcherValue(reqRules.reqCharset);
		}
		
		if (reqRules.referer) {
			var referer = util.getMatcherValue(reqRules.referer);
			util.setHeader(data, 'referer', referer);
		}
		
		if (reqRules.accept) {
			var accept = util.getMatcherValue(reqRules.accept);
			util.setHeader(data, 'accept', accept);
		}
		
		if (reqRules.ua) {
			var ua = util.getMatcherValue(reqRules.ua);
			util.setHeader(data, 'user-agent', ua);
		}
		
		if (reqRules.etag) {
			var etag = util.getMatcherValue(reqRules.etag);
			util.setHeader(data, 'etag', etag);
		}
		
		var reqDelay = util.getMatcherValue(reqRules.reqDelay);
		reqDelay = reqDelay && parseInt(reqDelay, 10);
		if (reqDelay > 0) {
			data.delay = reqDelay;
		}
		
		var reqSpeed = util.getMatcherValue(reqRules.reqSpeed);
		reqSpeed = reqSpeed && parseFloat(reqSpeed);
		if (reqSpeed > 0) {
			data.speed = reqSpeed;
		}

		handleCookies(data, cookies, req.headers.cookie);
		handleAuth(data, auth || authObj);
		handleCors(data, cors);
		
		util.readInjectFiles(data, function(data) {
			util.getRuleValue([reqRules.reqBody, reqRules.reqPrepend, reqRules.reqAppend], 
				function(reqBody, reqPrepend, reqAppend) {
					if (reqBody) {
						data.body = reqBody;
					}
					
					if (reqPrepend) {
						data.top = reqPrepend;
					}
					
					if (reqAppend) {
						data.bottom = reqAppend;
					}
					
					handleReq(req, data);
					handleParams(req, params);
					util.removeUnsupportsHeaders(req.headers);
					removeDisableProps(req);
					handleReplace(req, replacement);
					util.getFileWriters([util.hasRequestBody(req) ? util.getRuleFile(reqRules.reqWrite) : null, util.getRuleFile(reqRules.reqWriteRaw)], function(writer, rawWriter) {
						if (writer) {
							req.add(new FileWriterTransform(writer, req));
						}
						
						if (rawWriter) {
							req.add(new FileWriterTransform(rawWriter, req, true));
						}
						
						next();
					});
				});
		});
	});
};