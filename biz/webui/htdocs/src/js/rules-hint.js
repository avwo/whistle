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
var curHintProto, curFocusProto, curHintValue, curHintList, hintTimer, curHintPos, curHintOffset;
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
  var url = plugin.hintUrl || '';
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
  if (keyword === 'csp') {
    list.push('disable://csp');
  } else if ('upstream'.indexOf(keyword) !== -1) {
    list.push('proxy://', 'xproxy://');
  } else if ('xupstream'.indexOf(keyword) !== -1) {
    list.push('xproxy://');
  } else if ('extend'.indexOf(keyword) !== -1) {
    list.push('reqMerge://', 'resMerge://');
  }
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
      var result = [];
      var len = 60;
      list.forEach(function(item) {
        if (!item || len < 1) {
          return;
        }
        if (typeof item === 'string') {
          --len;
          result.push(item);
          return;
        }
        var value = item.value;
        if (!value || typeof value !== 'string') {
          return;
        }
        --len;
        var label = item.label;
        if (!label || typeof label !== 'string') {
          result.push(value);
        } else {
          result.push({
            text: value,
            displayText: label
          });
        }
      });
      return result;
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
  curHintList = [];
  curHintMap = {};
  curHintPos = null;
  curHintOffset = 0;
  if (!data || cgi.hasDestroyed || (!Array.isArray(data) && !Array.isArray(data.list))) {
    curHintValue = curHintProto = null;
    return;
  }
  curHintValue = value;
  curHintProto = protoName;
  var len = 0;
  if (!Array.isArray(data)) {
    curHintPos = data.position;
    curHintOffset = parseInt(data.offset, 10) || 0;
    data = data.list;
  }
  protoName += '://';
  data.forEach(function(item) {
    if (len >= 60) {
      return;
    }
    if (typeof item === 'string') {
      item = protoName + item.trim();
      if (item.length < MAX_HINT_LEN && !curHintMap[item]) {
        ++len;
        curHintList.push(item);
        curHintMap[item] = getRuleHelp(plugin);
      }
    } else if (item) {
      var label, value;
      if (typeof item.label === 'string') {
        label = item.label.trim();
      }
      if (!label && typeof item.display === 'string') {
        label = item.display.trim();
      }
      if (typeof item.value === 'string') {
        value = protoName + item.value.trim();
      }
      if (value && value.length < MAX_HINT_LEN && !curHintMap[label || value]) {
        ++len;
        curHintList.push(label && label !== value ? {
          displayText: label,
          text: value
        } : value);
        curHintMap[label || value] = getRuleHelp(plugin, item.help);
      }
    }
  });
  if (waitingRemoteHints && len) {
    editor._byPlugin = true;
    editor.execCommand('autocomplete');
  }
}

var WORD = /\S+/;
var showAtHint;
CodeMirror.registerHelper('hint', 'rulesHint', function(editor, options) {
  showAtHint = false;
  waitingRemoteHints = false;
  curFocusProto = null;
  var byDelete = editor._byDelete || editor._byPlugin;
  var byEnter = editor._byEnter;
  editor._byDelete = editor._byPlugin = editor._byEnter = false;
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
    list = !byEnter && getAtValueList(curWord.substring(1));
    if (!list || !list.length) {
      return;
    }
    showAtHint = true;
    return { list: list, from: CodeMirror.Pos(cur.line, start + 1), to: CodeMirror.Pos(cur.line, end) };
  }
  if (curWord) {
    if (PLUGIN_NAME_RE.test(curWord)) {
      var plugin = dataCenter.getPlugin(RegExp.$2);
      if (plugin && (typeof plugin.hintUrl === 'string' || plugin.hintList)) {
        var value = RegExp.$3 || '';
        value = value.length === 2 ?  curWord.substring(curWord.indexOf('//') + 2) : '';
        if (value && (value.length > MAX_HINT_LEN || byEnter)) {
          return;
        }
        clearTimeout(hintTimer);
        var protoName = RegExp.$1.slice(0, -1);
        if (plugin.hintList) {
          if (value) {
            value = value.toLowerCase();
            curHintList = plugin.hintList.filter(function(item) {
              if (typeof item === 'string') {
                return item.toLowerCase().indexOf(value) !== -1;
              }
              return item.text.toLowerCase().indexOf(value) !== -1;
            });
          } else {
            curHintList = plugin.hintList;
          }
          if (!curHintList.length) {
            return;
          }
          curHintMap = {};
          curHintList = curHintList.map(function(item) {
            var text;
            if (typeof item === 'string') {
              text = protoName + '://' + item;
            } else {
              text = protoName + '://' + item.text;
            }
            curHintMap[text] = getRuleHelp(plugin, item.help);
            return text;
          });
          curHintPos = '';
          curHintOffset = 0;
          curHintProto = protoName;
          value = curHintValue;
        }
        if (curHintList && curHintList.length && curHintProto === protoName && value === curHintValue) {
          if (commentIndex !== -1) {
            curLine = curLine.substring(0, commentIndex);
          }
          curLine = curLine.substring(start).split(/\s/, 1)[0];
          curFocusProto = protoName;
          end = start + curLine.trim().length;
          var from = CodeMirror.Pos(cur.line, start);
          var to = CodeMirror.Pos(cur.line, end);
          var hintList = curHintList;
          var isCursorPos = curHintPos === 'cursor';
          if (curHintOffset || isCursorPos) {
            hintList = hintList.map(function(item) {
              var hint = {
                from: from,
                to: to
              };
              if (typeof item === 'string') {
                hint.text = item;
                hint.displayText = item;
              } else {
                hint.text = item.text;
                hint.displayText = item.displayText;
              }
              return hint;
            });
            if (isCursorPos) {
              from = cur;
            }
          }
          if (curHintPos === 'tail') {
            var temp = from;
            from = to;
            to = temp;
          }
          if (curHintOffset) {
            start = Math.max(start, from.ch + curHintOffset);
            if (start > end) {
              start = end;
            }
            from = CodeMirror.Pos(cur.line, start);
          }
          return { list: hintList, from: from, to: to };
        }
        waitingRemoteHints = true;
        hintTimer = setTimeout(function() {
          var getRemoteHints = getHintCgi(plugin);
          if (!editor._bindedHintEvents) {
            editor._bindedHintEvents = true;
            editor.on('blur', function() {
              waitingRemoteHints = false;
            });
          }
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
  } else if (byDelete) {
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
      curValue = name;
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
  if (curValue && (name === curHintProto || curFocusProto === curHintProto) && (url = curHintMap[curValue])) {
    return url;
  }
  return protocols.getHelpUrl(name);
};
