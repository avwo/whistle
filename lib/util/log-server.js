var MAX_LENGTH = 512;
var MIN_LENGTH = 420;
var SIZE = 1024 * 64;
var COUNT = 100;
var count = 0;
var logs = [];

function sliceLogs(index, count, logId) {
  if (!logId) {
    return logs.slice(index, index + count);
  }
  var result = [];
  for (var len = logs.length; index < len; index++) {
    var log = logs[index];
    if (log.logId === logId) {
      result.push(log);
      if (--count <= 0) {
        return result;
      }
    }

  }
  return result;
}

function getLogs(startTime, count, logId) {
  var len = logs.length;
  if (!len || startTime == -1) {
    return [];
  }

  count = Math.min(count || COUNT, len);
  if (startTime === 0) {
    return logs.slice(-1);
  }

  if (startTime != -2 && startTime) {
    for (var i = 0; i < len; i++) {
      var log = logs[i];
      if (log.id === startTime) {
        return sliceLogs(i + 1, count, logId);
      }
    }
  }
  return sliceLogs(0, count, logId);
}

module.exports = function init(proxy) {
  proxy.addLog = function set(log) {
    if (!log) {
      return;
    }

    var now = Date.now();
    var text = log.text;
    if (text == null) {
      text = '';
    } else if (typeof text != 'string') {
      text += '';
    }
    logs.push({
      id: now + '-' + ++count,
      logId: log.id,
      date: now,
      level: /^fatal|error|warn|info|debug$/.test(log.level) ? log.level : 'info',
      text: text.substring(0, SIZE)
    });

    var len = logs.length;
    if (len > MAX_LENGTH) {
      logs = logs.slice(len - MIN_LENGTH, len);
    }
  };
  proxy.getLogs = getLogs;
  proxy.getLatestId = function() {
    var last = logs[logs.length - 1];
    return last && last.id;
  };
};
