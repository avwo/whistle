var MAX_LENGTH = 512;
var MIN_LENGTH = 420;
var SIZE = 1024 * 32;
var COUNT = 100;
var count = 0;
var logs = [];

function getLogs(startTime, logId, count) {
  var len = logs.length;
  if (!len || startTime == -1) {
    return [];
  }

  count = Math.min(count || COUNT, len);
  if (startTime == -2 || !startTime) {
    return logs.slice(0, count);
  }
  for (var i = 0; i < len; i++) {
    var log = logs[i];
    if (log.id === startTime) {
      return logs.slice(i + 1, i + 1 + count);
    }
  }
  return logs.slice(0, count);
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
};
