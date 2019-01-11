require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint.js');
var $ = require('jquery');
var CodeMirror = require('codemirror');
var protocols = require('./protocols');

var AT_RE = /^@/;
var PROTOCOL_RE = /^([^\s:]+):\/\//;
var extraKeys = {'Alt-/': 'autocomplete'};
var CHARS = ['"-"', '"_"', 'Shift-2', '@'];
for (var i = 0; i < 10; i++) {
  CHARS.push('\'' + i + '\'');
}
for (var a = 'a'.charCodeAt(), z = 'z'.charCodeAt(); a <= z; a++) {
  var ch = String.fromCharCode(a);
  CHARS.push('\'' + ch.toUpperCase() + '\'');
  CHARS.push('\'' + ch + '\'');
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

var WORD = /\S+/;
var showAtHint;
CodeMirror.registerHelper('hint', 'rulesHint', function(editor, options) {
  showAtHint = false;
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
  if (curWord && curWord.indexOf('//') !== -1) {
    return;
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

function getFocusRuleName(editor) {
  var name;
  var activeHint = $('li.CodeMirror-hint-active');
  if (activeHint.is(':visible')) {
    name = activeHint.text();
    if (showAtHint) {
      name = '@' + name;
    } else {
      var index = name.indexOf(':');
      if (index !== -1) {
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
  return protocols.getHelpUrl(name);
};
