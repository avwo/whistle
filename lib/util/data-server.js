var util = require('../rules/util');
var TIMEOUT = 36000;
var CLEAR_INTERVAL = 5000;
var CACHE_TIME = CLEAR_INTERVAL * 2;
var MAX_LENGTH = 512;
var MIN_LENGTH = 412;
var COUNT = 100;
var count = 0;
var ids = [];
var data = {};
var proxy, binded, timeout, interval;

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
		interval = setInterval(clearCache, CLEAR_INTERVAL);
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
	++index;
	for (var i = 0; i < index; i++) {
		var id = ids[i];
		var curData = data[id];
		if (curData.read && (!curData.endTime || now - curData.endTime < CACHE_TIME 
				|| now - curData.startTime < TIMEOUT)) {
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

function getIds(startTime, count) {
	var len = ids.length;
	if (!len) {
		return [];
	}
	
	startTime = ((startTime || Date.now() - 3000) + '').split('-');
	count = Math.min(count || COUNT, len);
	
	startTime[0] = parseInt(startTime[0], 10) || 0;
	startTime[1] = parseInt(startTime[1], 10) || 0;
	
	if (compareId(ids[0], startTime)) {
		
		return ids.slice(0, count);
	}
	
	var end = len - 1;
	if (!end || !compareId(ids[end], startTime)) {
		
		return  [];
	}
	
	var index = getIndex(startTime, 0, end);
	return ids.slice(index, index + count);
}

function compareId(curId, refId) {
	curId = curId.split('-');
	return curId[0] > refId[0] || (curId[0] == refId[0] && curId[1] > refId[1]);
}

function getIndex(startTime, start, end) {
	if (end - start <= 1) {
		return compareId(ids[start], startTime) ? start : end;
	}
	
	var mid = Math.floor((start + end) / 2);
	var id = ids[mid];
	return compareId(id, startTime) ? getIndex(startTime, start, mid) : getIndex(startTime, mid + 1, end);
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
	var curData = req.data;
	if (!util.filterUrl(curData.url)) {
		return;
	}
	var startTime = curData.startTime;
	var id = curData.id = startTime + '-' + ++count;
	data[id] = curData;
	ids.push(id);
}

module.exports = function init(_proxy) {
	proxy = _proxy;
	/**
	 * options: {
	 * 		startTime: timestamp || timestamp + '-' + count
	 * 		count: 获取新数据的数量
	 * 		ids: 请未结束的id列表
	 * }
	 * 
	 * @param options
	 */
	proxy.getData = function get(options) {
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
	};
};