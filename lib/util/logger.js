
var util = require('util');

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
  if (startTime === 0) {
    return logs.slice(-1);
  }

  if (startTime != -2 && startTime) {
    for (var i = 0; i < len; i++) {
      var log = logs[i];
      if (log.id === startTime) {
        ++i;
        return logs.slice(i, i + count);
      }
    }
  }
  return logs.slice(0, count);
}

function log(text, level) {
  var now = Date.now();
  logs.push({
    id: now + '-' + ++count,
    date: now,
    level: level,
    text: text
  });
  var len = logs.length;
  if (len > MAX_LENGTH) {
    logs = logs.slice(len - MIN_LENGTH, len);
  }
}

exports.getLogs = getLogs;

LEVELS.forEach(function(level) {
  exports[level] = function(msg) {
    if (msg == null && arguments.length < 2) {
      return;
    }
    log(util.format.apply(null, arguments), level);
  };
});

exports.getLatestId = function() {
  var last = logs[logs.length - 1];
  return last && last.id;
};

exports.log = exports.info;


