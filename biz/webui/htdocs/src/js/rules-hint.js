require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint.js');
var $ = require('jquery');
var CodeMirror = require('codemirror');
var protocols = require('./protocols');
var dataCenter = require('./data-center');

var NON_SPECAIL_RE = /[^:/]/;
var PLUGIN_NAME_RE = /^((?:whistle\.)?([a-z\d_\-]+:))(\/?$|\/\/)/;
var MAX_HINT_LEN = 512;
var AT_RE = /^@/;
var PROTOCOL_RE = /^([^\s:]+):\/\//;
var HINT_TIMEOUT = 120;
var curHintMap = {};
var curHintProto, curHintValue, curHintList, hintTimer;
var hintUrl, hintCgi, waitingRemoteHints;
var extraKeys = {'Alt-/': 'autocomplete'};
var CHARS = [
  '-', '"_"', 'Shift-2', '.', ',', 'Shift-,', 'Shift-.', 'Shift-;', '/', 'Shift-/',
  'Shift-1', 'Shift-4', 'Shift-5', 'Shift-6', 'Shift-7', 'Shift-8',
  '=', 'Shift-=', '\'', 'Shift-\'', ';', 'Shift-;', '\\', 'Shift-\\', 'Shift-`',
  '[', ']', 'Shift-[', 'Shift-]', 'Shift-9', 'Shift-0'
];
for (var i = 0; i < 10; i++) {
  CHARS.push('\'' + i + '\'');
}
for (var a = 'a'.charCodeAt(), z = 'z'.charCodeAt(); a <= z; a++) {
  var ch = String.fromCharCode(a);
  CHARS.push('\'' + ch.toUpperCase() + '\'');
  CHARS.push('\'' + ch + '\'');
}

function getHintCgi(plugin) {
  var moduleName = plugin.moduleName;
  var url = plugin.hintUrl;
  var pluginName = 'plugin.' + moduleName.substring(8);
  if (url.indexOf(moduleName) !== 0 && url.indexOf(pluginName) !== 0) {
    url = pluginName + '/' + url;
  }
  if (hintUrl !== url) {
    if (hintCgi) {
      hintCgi.hasDestroyed = true;
    }
    hintUrl = url;
    hintCgi = dataCenter.createCgi(url, true);
  }
  return hintCgi;
}

function getHints(keyword) {
  var allRules = protocols.getAllRules();
  if (!keyword) {
    return allRules;
  }
  keyword = keyword.toLowerCase();
  if (keyword === 'csp') {
    return ['disable://csp'];
  }
  if (keyword.indexOf('up') === 0) {
    return ['proxy://'];
  }
  if (keyword.indexOf('xup') === 0) {
    return ['xproxy://'];
  }
  if (keyword.length > 2 && 'extend'.indexOf(keyword) === 0) {
    return ['reqMerge://', 'resMerge://'];
  }
  var list = allRules.filter(function(name) {
    if (name === 'socks://' && 'proxy'.indexOf(keyword) !== -1) {
      return true;
    }
    name = name.toLowerCase();
    return name.indexOf(keyword) !== -1;
  });
  list.sort(function(cur, next) {
    var curIndex = cur.toLowerCase().indexOf(keyword);
    var nextIndex = next.toLowerCase().indexOf(keyword);
    if (curIndex === nextIndex) {
      return 0;
    }
    return curIndex < 0 || (curIndex > nextIndex && nextIndex >= 0) ? 1 : -1;
  });
  return list;
}

function getAtValueList(keyword) {
  try {
    var getAtValueList = window.parent.getAtValueListForWhistle;
    if (typeof getAtValueList !== 'function') {
      return;
    }
    var list = getAtValueList(keyword);
    if (Array.isArray(list)) {
      return list.filter(function(item) {
        return item && typeof item === 'string';
      }).slice(0, 60);
    }
  } catch (e) {}
}

function getAtHelpUrl(name, options) {
  try {
    var _getAtHelpUrl = window.parent.getAtHelpUrlForWhistle;
    if (typeof _getAtHelpUrl !== 'function') {
      return;
    }
    var url = _getAtHelpUrl(name, options);
    if (url === false || typeof url === 'string') {
      return url;
    }
  } catch (e) {}
}

function getRuleHelp(plugin, helpUrl) {
  if (typeof helpUrl !== 'string') {
    helpUrl = '';
  }
  return helpUrl || plugin.homepage || 'https://avwo.github.io/whistle/plugins.html';
}

function handleRemoteHints(data, editor, plugin, protoName, value, cgi) {
  if (!data || cgi.hasDestroyed || !Array.isArray(data)) {
    curHintValue = curHintProto = null;
    return;
  }
  curHintValue = value;
  curHintProto = protoName;
  curHintList = [];
  curHintMap = {};
  data.forEach(function(item) {
    if (typeof item === 'string') {
      item = item.replace(/\s+/g, '');
      if (!curHintMap[item]) {
        curHintList.push(protoName + '://' + item);
        curHintMap[item] = getRuleHelp(plugin);
      }
    } else if (item && typeof item.value === 'string') {
      var value = item.value.replace(/\s+/g, '');
      if (!curHintMap[value]) {
        curHintList.push(protoName + '://' + value);
        curHintMap[value] = getRuleHelp(plugin, item.help);
      }
    }
  });
  if (waitingRemoteHints && curHintList.length) {
    editor.execCommand('autocomplete');
  }
}

var WORD = /\S+/;
var showAtHint;
CodeMirror.registerHelper('hint', 'rulesHint', function(editor, options) {
  showAtHint = false;
  waitingRemoteHints = false;
  var cur = editor.getCursor();
  var curLine = editor.getLine(cur.line);
  var end = cur.ch, start = end, list;
  var commentIndex = curLine.indexOf('#');
  if ((commentIndex !== -1 && commentIndex < start)) {
    return;
  }
  while (start && WORD.test(curLine.charAt(start - 1))) {
    --start;
  }
  var curWord = start != end && curLine.substring(start, end);
  if (AT_RE.test(curWord)) {
    list = getAtValueList(curWord.substring(1));
    if (!list || !list.length) {
      return;
    }
    showAtHint = true;
    return { list: list, from: CodeMirror.Pos(cur.line, start + 1), to: CodeMirror.Pos(cur.line, end) };
  }
  if (curWord) {
    if (PLUGIN_NAME_RE.test(curWord)) {
      var plugin = dataCenter.getPlugin(RegExp.$2);
      if (plugin && typeof plugin.hintUrl === 'string') {
        var value = RegExp.$3 || '';
        value = value.length === 2 ?  curWord.substring(curWord.indexOf('//') + 2) : '';
        if (value.length > MAX_HINT_LEN) {
          return;
        }
        clearTimeout(hintTimer);
        var protoName = RegExp.$1.slice(0, -1);
        if (curHintList && curHintList.length && curHintProto === protoName && value === curHintValue) {
          if (commentIndex !== -1) {
            curLine = curLine.substring(0, commentIndex);
          }
          return { list: curHintList, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, start + curLine.trim().length) };
        }
        waitingRemoteHints = true;
        hintTimer = setTimeout(function() {
          var getRemoteHints = getHintCgi(plugin);
          getRemoteHints({
            protocol: protoName,
            value: value
          }, function(data) {
            handleRemoteHints(data, editor, plugin, protoName, value, getRemoteHints);
          });
        }, HINT_TIMEOUT);
      }
    }
    if (curWord.indexOf('//') !== -1 || !NON_SPECAIL_RE.test(curWord)) {
      return;
    }
  }
  list = getHints(curWord);
  if (!list.length) {
    return;
  }
  var index = curLine.indexOf('://', start);
  var protocol;
  if (index !== -1) {
    index = index + 3;
    protocol = curLine.substring(start, index);
    // redirect://http://
    if (!/\s/.test(protocol) && (curWord.indexOf('red') !== 0 ||
      (protocol !== curWord + 'http://' && protocol !== curWord + 'https://'))) {
      end = index;
    }
  } else {
    index = curLine.indexOf(':', start);
    if (index !== -1) {
      ++index;
      protocol = curLine.substring(start, index) + '//';
      if (list.indexOf(protocol) !== -1) {
        end = index;
        var curChar = curLine[end];
        if (curChar === '/') {
          end++;
          curChar = curLine[end];
          if (curChar === '/') {
            end++;
          }
        }
      }
    }
  }
  return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
});

CodeMirror.commands.autocomplete = function(cm) {
  cm.showHint({
    hint: CodeMirror.hint.rulesHint,
    completeSingle: false
  });
};

function completeAfter(cm, pred) {
  if (!pred || pred()) setTimeout(function() {
    if (!cm.state.completionActive) {
      cm.showHint({
        hint: CodeMirror.hint.rulesHint,
        completeSingle: false
      });
    }
  }, 100);
  return CodeMirror.Pass;
}

CHARS.forEach(function(ch) {
  extraKeys[ch] = completeAfter;
});
var curValue;
function getFocusRuleName(editor) {
  curValue = null;
  var name;
  var activeHint = $('li.CodeMirror-hint-active');
  if (activeHint.is(':visible')) {
    name = activeHint.text();
    if (showAtHint) {
      name = '@' + name;
    } else {
      var index = name.indexOf(':');
      if (index !== -1) {
        curValue = name.substring(index + 3);
        name = name.substring(0, index);
      }
    }
  } else {
    var cur = editor.getCursor();
    var end = cur.ch;
    var curLine = editor.getLine(cur.line).replace(/(#.*|\s+)$/, '');
    var len = curLine.length;
    if (end <= len) {
      var start = end;
      while(--start >= 0) {
        if (/\s/.test(curLine[start])) {
          break;
        }
      }
      ++start;
      while(++end <= len) {
        if (/\s/.test(curLine[end])) {
          break;
        }
      }
      curLine = curLine.slice(start, end);
      if (AT_RE.test(curLine)) {
        name = curLine;
      } else if (PROTOCOL_RE.test(curLine)) {
        name = RegExp.$1;
      }
    }
  }
  return name;
}

exports.getExtraKeys = function() {
  return extraKeys;
};

exports.getHelpUrl = function(editor, options) {
  var name = getFocusRuleName(editor);
  var url;
  if (AT_RE.test(name) && (url = getAtHelpUrl(name.substring(1), options))) {
    return url;
  }
  if (url === false) {
    return false;
  }
  if (name === curHintProto && (url = curHintMap[curValue])) {
    return url;
  }
  return protocols.getHelpUrl(name);
};
