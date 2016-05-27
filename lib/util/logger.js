var MAX_LENGTH = 360;
var MIN_LENGTH = 280;
var COUNT = 100;
var count = 0;
var logs = [];
var LEVELS = ['fatal', 'error', 'warn', 'info', 'debug'];

function getLogs(startTime, count) {
	var len = logs.length;
	if (!len || startTime == -1) {
		return [];
	}
	
	count = Math.min(count || COUNT, len);
	if (startTime == -2) {
		return logs.slice(0, count);
	}
	
	startTime = ((startTime || Date.now() - 3000) + '').split('-');
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

function getStack(err) {
	err = err && err.stack || err;
	return err == null ? '' : err + '';
}

function log(err, level) {
	if (!(err = getStack(err))) {
		return;
	}
	var now = Date.now();
	logs.push({
		id: now + '-' + ++count,
		date: now,
		level: LEVELS.indexOf(log.level) != -1 ? log.level : 'info',
		text: err
	});
	var len = logs.length;
	if (len > MAX_LENGTH) {
		logs = logs.slice(len - MIN_LENGTH, len);
	}
}

exports.getLogs = getLogs;

LEVELS.forEach(function(level) {
	exports[level] = function(err) {
		log(err, level);
	};
});

exports.log = log;

