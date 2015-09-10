var util = require('./index');
var MAX_LENGTH = 512;
var MIN_LENGTH = 400;
var SIZE = 1024 * 32;
var COUNT = 100;
var count = 0;
var logs = [];

function getLogs(startTime, count) {
	var len = logs.length;
	if (!len) {
		return [];
	}
	
	startTime = ((startTime || Date.now() - 6000) + '').split('-');
	count = Math.min(count || COUNT, len);
	
	startTime[0] = parseInt(startTime[0], 10) || 0;
	startTime[1] = parseInt(startTime[1], 10) || 0;
	
	if (compareId(logs[0].id, startTime)) {
		
		return logs.slice(0, count);
	}
	
	var end = len - 1;
	if (!end || !compareId(logs[end].id, startTime)) {
		return  [];
	}
	
	var index = getIndex(startTime, 0, end);
	return logs.slice(index, index + count);
}

function getIndex(startTime, start, end) {
	if (end - start <= 1) {
		return compareId(logs[start].id, startTime) ? start : end;
	}
	
	var mid = Math.floor((start + end) / 2);
	return compareId(logs[mid].id, startTime) ? getIndex(startTime, start, mid) : getIndex(startTime, mid + 1, end);
}

function compareId(curId, refId) {
	curId = curId.split('-');
	return curId[0] > refId[0] || (curId[0] == refId[0] && curId[1] > refId[1]);
}

module.exports = function init(proxy) {
	
	proxy.addLog = function set(log) {
		if (typeof log != 'string' || !log) {
			return;
		}
		
		var now = Date.now();
		logs.push({
			id: now + '-' + ++count,
			date: now,
			text: log.substring(0, SIZE)
		});
		var len = logs.length;
		if (len > MAX_LENGTH) {
			logs = logs.slice(len - MIN_LENGTH, len);
		}
	};
	
	proxy.getLogs = getLogs;
};