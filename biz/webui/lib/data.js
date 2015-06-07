var iconv = require('iconv-lite');
var zlib = require('zlib');
var MAX_REQ_SIZE = 128 * 1024;
var MAX_RES_SIZE = 256 * 1024;
var TIMEOUT = 10000;
var MAX_LENGTH = 512;
var MIN_LENGTH = 412;
var COUNT = 100;
var count = 0;
var ids = [];
var data = {};
var proxy, binded, timeout, interval, util;

function disable() {
	proxy.removeListener('request', handleRequest);
	ids = [];
	data = {};
	interval && clearInterval(interval);
	interval = null;
	binded = false;
}

function enable() {
	!binded && proxy.on('request', handleRequest);
	binded = true;
	clearTimeout(timeout);
	timeout = setTimeout(disable, TIMEOUT);
	if (!interval) {
		interval = setInterval(clearCache, 3000);
	}
}

/**
 * 如果超过最大缓存数，清理如下请求数据：
 * 1. 已经请求结束且结束时间超过10秒
 * 2. 请求#1前面的未结束且未被ui读取过的请求
 */
function clearCache() {
	var len = ids.length;
	if (len <= MAX_LENGTH) {
		return;
	}
	
	var index = -1; //已经完成，且缓存超过10s的最后一个请求
	var now = Date.now();
	for (var i = len - 1; i >= 0; i--) {
		var curData = data[ids[i]];
		if (curData.endTime && now - curData.endTime > TIMEOUT) {
			index = i;
			break;
		}
	}
	
	if (index < 0) {
		return;
	}
	
	var _ids = [];
	var end;
	++index;
	for (var i = 0; i < index; i++) {
		var id = ids[i];
		var curData = data[id];
		if (curData.read && !curData.endTime) {
			_ids.push(id);
		} else {
			delete data[id];
			if (--len <= MIN_LENGTH) {
				_ids.push.apply(_ids, ids.slice(i + 1, index));
				break;
			}
		}
	}
	ids = _ids.concat(ids.slice(index));
}


function passThrough(chunk, encoding, callback) {
	callback(null, chunk);
}

function decode(body) {
	if (body) {
		var _body = body + '';
		if (_body.indexOf('�') != -1) {
			_body = iconv.decode(body, 'gbk');
		}
		body = _body;
	}
	
	return body;
}

function get(options) {
	enable();
	options = options || {};
	var data = {};
	var newIds = options.startTime == -1 ? [] : getIds(options.startTime, options.count);
	var list = getList(newIds).concat(getList(options.ids));
	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i];
		if (item) {
			data[item.id] = item;
		}
	}
	
	return {
		ids: options.ids || [],
		newIds: newIds,
		data: data
	};
}

function getIds(startTime, count) {
	var len = ids.length;
	if (!len) {
		return [];
	}
	
	startTime = (startTime || Date.now() - 3000) + '';
	count = Math.min(count || COUNT, len);
	if (ids[0] > startTime) {
		
		return ids.slice(0, count);
	}
	
	if (len === 1 || ids[len - 1] <= startTime) {
		
		return  [];
	}
	
	var index = getIndex(startTime, 0, len - 1);
	return ids.slice(index, index + count);
}

function getIndex(startTime, start, end) {
	if (end - start <= 1) {
		return end;
	}
	
	var mid = Math.floor((start + end) / 2);
	return ids[mid] <= startTime ? getIndex(startTime, mid + 1, end)
			: getIndex(startTime, start, mid);
}

function getList(ids) {
	var result = [];
	for (var i = 0, len = ids && ids.length; i < len; i++) {
		var id = ids[i];
		var curData = data[id];
		if (curData) {
			curData.read = true;
			result[i] = curData;
		}
	}
	
	return result;
}

function handleRequest(req) {
	var dnsTime = req.dnsTime || 0;
	req.dnsTime = Date.now();
	var startTime = req.dnsTime - dnsTime;
	var id = startTime + '-' + ++count;
	var reqData = {
			method: req.method || 'GET', 
			httpVersion: req.httpVersion || '1.1',
            ip: req.ip || '::ffff:127.0.0.1',
            headers: req.headers
		};
	var resData = {
			ip: req.host
	};
	
	var curData = data[id] = {
			id: id,
			url: req.url,
			startTime: startTime,
			dnsTime: req.dnsTime,
			req: reqData,
			res: resData,
			rules: req.rules
	};
	
	ids.push(id);
	req.on('response', handleResponse);
	req.on('error', function(err) {
		reqData.body = err && err.stack;
		curData.endTime = reqData.requestTime = Date.now();
		curData.reqError = true;
		req.removeListener('response', handleResponse);
		req._transform = passThrough;
	});
	
	var reqBody;
	
	if (util.hasRequestBody(req)) {
		reqBody = false;
	}
	req._transform = function(chunk, encoding, callback) {
		
		if (chunk && (reqBody || reqBody === false)) {
			reqBody = reqBody ? Buffer.concat([reqBody, chunk]) : chunk;
		}
		
		if (reqBody && reqBody.length > MAX_REQ_SIZE) {
			reqBody = null;
		}
		
		if (!chunk) {
			curData.requestTime = Date.now();
			curData.reqEnd = true;
			reqData.body = decode(reqBody);
		}
		
		callback(null, chunk);
	};
	
	function handleResponse(res) {
		curData.responseTime = Date.now();
		resData.headers = res.headers;
		resData.statusCode = res.statusCode;
		resData.ip = res.ip;
		res.on('error', function(err) {
			resData.body = err && err.stack;
			curData.endTime = Date.now();
			curData.resError = true;
			res._transform = passThrough;
		});
		
		var resBody;
		var contentType = util.getContentType(res.headers);
		if (contentType && contentType != 'IMG' && util.hasBody(res)) {
			resBody = false;
		}

		res._transform = function(chunk, encoding, callback) {
			if (chunk && (resBody || resBody === false)) {
				resBody = resBody ? Buffer.concat([resBody, chunk]) : chunk;
			}
			
			if (resBody && resBody.length > MAX_RES_SIZE) {
				resBody = null;
			}
			
			if (!chunk) {
				curData.endTime = Date.now();
				curData.resEnd = true;
				if (resBody) {
					var unzip;
					switch (util.toLowerCase(res.headers['content-encoding'])) {
					    case 'gzip':
					    	unzip = zlib.gunzip.bind(zlib);
					      break;
					    case 'deflate':
					    	unzip = zlib.inflate.bind(zlib);
					      break;
					}
					
					if (unzip) {
						unzip(resBody, function(err, body) {
							if (err) {
								callback(err, chunk);
								return;
							}
							resData.body = decode(body);
							callback(null, chunk);
						});
						return;
					}
				}
				resData.body = decode(resBody);
			}
			
			callback(null, chunk);
		};
	}
	
}

module.exports = function init(_proxy) {
	proxy = _proxy;
	util = proxy.util;
	enable();
	module.exports = get;
};