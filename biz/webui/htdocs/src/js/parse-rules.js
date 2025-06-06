var util = require('./util');

var SPACE_RE = /\s+/g;
var IP_PORT_RE = /^(?:\[([:\da-f.]+)\]|(?:\d{1,3}\.){3}\d{1,3})(?::(\d+))?$/i;
var SCHEMA_RE = /^\/\//;
var REG_EXP_RE = /^\/(.+)\/(i?u?|ui)$/;
var SPECIAL_RE = /^[\^!$.:*~]/;
var WEB_PROTOCOL_RE = /^(?:https?|wss?|tunnel):\/\//;
var URL_RE = /^[^@%\\/\{\}\(\)<>]*[^@%\\/\{\}\(\)<>:](?:\/|$)/;
var OLD_FILTER_RE = /^filter:\/\/\w+:.+$/;
var FILTER_RE = /^(lineProps|excludeFilter|includeFilter):\/\/.*$/;


function isPattern(item) {
  return (
    SPECIAL_RE.test(item) ||
    SCHEMA_RE.test(item) ||
    REG_EXP_RE.test(item) ||
    WEB_PROTOCOL_RE.test(item)
  );
}

function getPatternIndex(list) {
  var ipIndex = -1;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (isPattern(item)) {
      return i;
    }
    if (URL_RE.test(item)) {
      if (!IP_PORT_RE.test(item)) {
        return i;
      } else if (ipIndex === -1) {
        ipIndex = i;
      }
    }
  }
  return ipIndex;
}

function getFilters(list) {
  var filters = [];
  list = list.filter(function (matcher) {
    if (FILTER_RE.test(matcher) || OLD_FILTER_RE.test(matcher)) {
      filters.push(matcher);
      return false;
    }
    return true;
  });
  return {
    list: list,
    filters: filters
  };
}

module.exports = function (str) {
  if (!str) {
    return '';
  }
  var values = {};
  var rawValues = {};
  var rules = [];
  var map = {};
  var addRules = function(rule) {
    var l = rule.join(' ');
    if (!map[l]) {
      map[l] = 1;
      rules.push(rule);
    }
  };
  util.formatRules(str, values, rawValues).forEach(function (line) {
    line = line.trim();
    if (!line) {
      return;
    }
    var list = line.split(SPACE_RE);
    if (list.length < 2) {
      if (line[0] === '@' || line[0] === '%') {
        addRules([line]);
      }
      return;
    }
    var data = getFilters(list);
    list = data.list;
    var index = getPatternIndex(list);
    if (index === -1) {
      return addRules([line]);
    }
    if (index === 0) {
      var pattern = list.shift();
      list.forEach(function (op) {
        addRules([pattern, op, ...data.filters]);
      });
    } else {
      var opList = [];
      var patternList = list.filter(function (p) {
        if (isPattern(p) || URL_RE.test(p)) {
          return true;
        }
        opList.push(p);
      });
      opList.forEach(function (op) {
        patternList.forEach(function (pattern) {
          addRules([pattern, op, ...data.filters]);
        });
      });
    }
  });
  return {
    rules: rules,
    values: values,
    rawValues: rawValues
  };
};
