var CONTROL_RE =
  /[\u001e\u001f\u200e\u200f\u200d\u200c\u202a\u202d\u202e\u202c\u206e\u206f\u206b\u206a\u206d\u206c]+/g;
var MULTI_LINE_VALUE_RE =
  /^[^\n\r\S]*(```+)[^\n\r\S]*(\S+)[^\n\r\S]*[\r\n]([\s\S]+?)[\r\n][^\n\r\S]*\1\s*$/gm;
var LINE_END_RE = /\n|\r\n|\r/g;
var COMMENT_RE = /#[^\r\n]*/g;
var MULTI_TO_ONE_RE = /^\s*line`\s*[\r\n]([\s\S]*?)[\r\n]\s*`\s*?$/gm;
var SPACE_RE = /\s+/g;
var IP_PORT_RE = /^(?:\[([:\da-f.]+)\]|(?:\d{1,3}\.){3}\d{1,3})(?::(\d+))?$/i;
var SCHEMA_RE = /^\/\//;
var REG_EXP_RE = /^\/(.+)\/(i?u?|ui)$/;
var SPECIAL_RE = /^[\^!$.:*~]/;
var WEB_PROTOCOL_RE = /^(?:https?|wss?|tunnel):\/\//;
var URL_RE = /^[^@%\\/\{\}\(\)<>]*[^@%\\/\{\}\(\)<>:](?:\/|$)/;
var OLD_FILTER_RE = /^filter:\/\/\w+:.+$/;
var FILTER_RE = /^(lineProps|excludeFilter|includeFilter):\/\/.*$/;

function removeValues(str, values, rawValues) {
  str = str && str.replace(CONTROL_RE, '').trim();
  if (!str || str.indexOf('```') === -1) {
    return str;
  }
  return str.replace(MULTI_LINE_VALUE_RE, function (all, _, key, value) {
    if (!values[key]) {
      values[key] = value;
      rawValues[key] = all.trim();
    }
    return '';
  });
}

function removeComment(str) {
  return str.replace(COMMENT_RE, '').trim();
}


function mergeLines(str) {
  return str.replace(MULTI_TO_ONE_RE, function(_, line) {
    return line.replace(SPACE_RE, ' ');
  });
}

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
  str = removeValues(str, values, rawValues);
  str = removeComment(str);
  str = mergeLines(str);
  str.split(LINE_END_RE).forEach(function (line) {
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
