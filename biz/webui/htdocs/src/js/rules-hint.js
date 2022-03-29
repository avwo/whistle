require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint.js');
var $ = require('jquery');
var CodeMirror = require('codemirror');
var protocols = require('./protocols');
var dataCenter = require('./data-center');

var disabledEditor = window.location.href.indexOf('disabledEditor=1') !== -1;
var NON_SPECAIL_RE = /[^:/]/;
var PLUGIN_NAME_RE = /^((?:whistle\.)?([a-z\d_\-]+:))(\/?$|\/\/)/;
var MAX_HINT_LEN = 512;
var MAX_VAR_LEN = 100;
var AT_RE = /^@/;
var P_RE = /^%/;
var P_VAR_RE = /^%([a-z\d_-]+)([=.])/;
var PLUGIN_SPEC_RE = /^(pipe|sniCallback):/;
var PROTOCOL_RE = /^([^\s:]+):\/\//;
var HINT_TIMEOUT = 120;
var curHintMap = {};
var curHintProto,
  curFocusProto,
  curHintValue,
  curHintList,
  hintTimer,
  curHintPos,
  curHintOffset;
var hintUrl, hintCgi, waitingRemoteHints;
var extraKeys = { 'Alt-/': 'autocomplete' };
var CHARS = [
  '-',
  '"_"',
  'Shift-2',
  '.',
  ',',
  'Shift-,',
  'Shift-.',
  'Shift-;',
  '/',
  'Shift-/',
  'Shift-1',
  'Shift-4',
  'Shift-5',
  'Shift-6',
  'Shift-7',
  'Shift-8',
  '=',
  'Shift-=',
  '\'',
  'Shift-\'',
  ';',
  'Shift-;',
  '\\',
  'Shift-\\',
  'Shift-`',
  '[',
  ']',
  'Shift-[',
  'Shift-]',
  'Shift-9',
  'Shift-0'
];
for (var i = 0; i < 10; i++) {
  CHARS.push('\'' + i + '\'');
}
for (var a = 'a'.charCodeAt(), z = 'z'.charCodeAt(); a <= z; a++) {
  var ch = String.fromCharCode(a);
  CHARS.push('\'' + ch.toUpperCase() + '\'');
  CHARS.push('\'' + ch + '\'');
}

$(window).on('hashchange', function () {
  var disabled = window.location.href.indexOf('disabledEditor=1') !== -1;
  if (disabled !== disabledEditor) {
    disabledEditor = disabled;
  }
});

function getHintCgi(plugin, pluginVars) {
  var moduleName = plugin.moduleName;
  var url = (pluginVars && pluginVars.hintUrl) || plugin.hintUrl || '';
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
  if (disabledEditor) {
    return [];
  }
  var allRules = protocols.getAllRules();
  if (!keyword) {
    return allRules;
  }
  keyword = keyword.toLowerCase();
  var list = allRules.filter(function (name) {
    if (name === 'socks://' && 'proxy'.indexOf(keyword) !== -1) {
      return true;
    }
    name = name.toLowerCase();
    return name.indexOf(keyword) !== -1;
  });
  list.sort(function (cur, next) {
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
  keyword = keyword.substring(1);
  try {
    var getList = window.parent.getAtValueListForWhistle;
    if (typeof getList !== 'function') {
      return;
    }
    var list = getList(keyword);
    if (Array.isArray(list)) {
      var result = [];
      var len = 60;
      list.forEach(function (item) {
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

function getPluginVarHints(keyword, specProto) {
  var list;
  if (specProto) {
    list = protocols.getAllPluginNameList();
    keyword = keyword.substring(specProto.length + 3);
  } else {
    keyword = keyword.substring(1);
    list = protocols.getPluginNameList();
  }
  if (!keyword) {
    return list.map(function (name) {
      return specProto ? specProto + '://' + name : name + '=';
    });
  }
  var result = [];
  keyword = keyword.toLowerCase();
  if (specProto) {
    keyword = specProto + '://' + keyword;
  }
  list.forEach(function (name) {
    if (specProto) {
      name = specProto + '://' + name;
    } else {
      name += '=';
    }
    if (name.indexOf(keyword) !== -1) {
      result.push(name);
    }
  });
  return result;
}

function getAtHelpUrl(name, options) {
  try {
    var _getAtHelpUrl = window.parent.getAtHelpUrlForWhistle;
    if (typeof _getAtHelpUrl === 'function') {
      var url = _getAtHelpUrl(name, options);
      if (url === false || typeof url === 'string') {
        return url;
      }
    }
  } catch (e) {}
  return 'https://avwo.github.io/whistle/rules/@.html';
}

function getRuleHelp(plugin, helpUrl) {
  if (typeof helpUrl !== 'string') {
    helpUrl = '';
  }
  return (
    helpUrl || plugin.homepage || 'https://avwo.github.io/whistle/plugins.html'
  );
}

function getHintText(protoName, text, isVar, isKey) {
  if (!isVar) {
    return protoName + '://' + text;
  }
  return protoName + (isKey ? '.' : '=') + text;
}

function handleRemoteHints(data, editor, plugin, protoName, value, cgi, isVar) {
  curHintList = [];
  curHintMap = {};
  curHintPos = null;
  curHintOffset = 0;
  if (
    !data ||
    cgi.hasDestroyed ||
    (!Array.isArray(data) && !Array.isArray(data.list))
  ) {
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
  var maxLen = isVar ? MAX_VAR_LEN : MAX_HINT_LEN;
  data.forEach(function (item) {
    if (len >= 60) {
      return;
    }
    if (typeof item === 'string') {
      item = getHintText(protoName, item.trim(), isVar);
      if (item.length < maxLen && !curHintMap[item]) {
        ++len;
        curHintList.push(item);
        curHintMap[item] = getRuleHelp(plugin);
      }
    } else if (item) {
      var label, curVal;
      if (typeof item.label === 'string') {
        label = item.label.trim();
      }
      if (!label && typeof item.display === 'string') {
        label = item.display.trim();
      }
      if (typeof item.value === 'string') {
        curVal = getHintText(protoName, item.value.trim(), isVar, item.isKey);
      }
      if (curVal && curVal.length < maxLen && !curHintMap[label || curVal]) {
        ++len;
        curHintList.push(
          label && label !== curVal
            ? {
              displayText: label,
              text: curVal
            }
            : curVal
        );
        curHintMap[label || curVal] = getRuleHelp(plugin, item.help);
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
var showVarHint;
CodeMirror.registerHelper('hint', 'rulesHint', function (editor, options) {
  showAtHint = false;
  showVarHint = false;
  waitingRemoteHints = false;
  curFocusProto = null;
  var byDelete = editor._byDelete || editor._byPlugin;
  var byEnter = editor._byEnter;
  editor._byDelete = editor._byPlugin = editor._byEnter = false;
  var cur = editor.getCursor();
  var curLine = editor.getLine(cur.line);
  var end = cur.ch,
    start = end,
    list;
  var commentIndex = curLine.indexOf('#');
  if (commentIndex !== -1 && commentIndex < start) {
    return;
  }
  while (start && WORD.test(curLine.charAt(start - 1))) {
    --start;
  }
  var curWord = start != end && curLine.substring(start, end);
  var isAt = AT_RE.test(curWord);
  var plugin;
  var pluginName;
  var value;
  var pluginVars;
  var specProto = PLUGIN_SPEC_RE.test(curWord) && RegExp.$1;
  var isPluginVar = P_RE.test(curWord);
  if (isPluginVar && P_VAR_RE.test(curWord)) {
    pluginName = RegExp.$1;
    plugin = pluginName && dataCenter.getPlugin(pluginName + ':');
    pluginVars = plugin && plugin.pluginVars;
    if (!pluginVars) {
      return;
    }
    value = curWord.substring(pluginName.length + 2);
    isPluginVar = false;
  }
  if (isAt || specProto || isPluginVar) {
    if (!byEnter || /^(?:pipe|sniCallback):\/\/$/.test(curWord)) {
      list = isAt
        ? getAtValueList(curWord)
        : getPluginVarHints(curWord, specProto);
    }
    if (!list || !list.length) {
      return;
    }
    if (isAt) {
      showAtHint = true;
    } else if (isPluginVar) {
      showVarHint = true;
    }
    return {
      list: list,
      from: CodeMirror.Pos(cur.line, specProto ? start : start + 1),
      to: CodeMirror.Pos(cur.line, end)
    };
  }
  if (curWord) {
    if (plugin || PLUGIN_NAME_RE.test(curWord)) {
      plugin = plugin || dataCenter.getPlugin(RegExp.$2);
      var pluginConf = pluginVars || plugin;
      if (
        plugin &&
        (typeof pluginConf.hintUrl === 'string' || pluginConf.hintList)
      ) {
        if (!pluginVars) {
          value = RegExp.$3 || '';
          value =
            value.length === 2
              ? curWord.substring(curWord.indexOf('//') + 2)
              : '';
          if (value && (value.length > MAX_HINT_LEN || byEnter)) {
            return;
          }
        } else if (value && (byEnter || value.length > MAX_VAR_LEN)) {
          return;
        }
        clearTimeout(hintTimer);
        var protoName = pluginVars ? '%' + pluginName : RegExp.$1.slice(0, -1);
        if (pluginConf.hintList) {
          if (value) {
            value = value.toLowerCase();
            curHintList = pluginConf.hintList.filter(function (item) {
              if (typeof item === 'string') {
                return item.toLowerCase().indexOf(value) !== -1;
              }
              if (item.text.toLowerCase().indexOf(value) !== -1) {
                return true;
              }
              return (
                item.displayText &&
                item.displayText.toLowerCase().indexOf(value) !== -1
              );
            });
          } else {
            curHintList = pluginConf.hintList;
          }
          if (!curHintList.length) {
            return;
          }
          curHintMap = {};
          curHintList = curHintList.map(function (item) {
            var hint;
            var text;
            if (typeof item === 'string') {
              text = getHintText(protoName, item, pluginVars);
            } else {
              text = getHintText(protoName, item.text, pluginVars, item.isKey);
              if (item.displayText) {
                text = item.displayText;
                hint = {
                  text: text,
                  displayText: item.displayText
                };
              }
            }
            curHintMap[text] = getRuleHelp(plugin, item.help);
            return hint || text;
          });
          curHintPos = '';
          curHintOffset = 0;
          curHintProto = protoName;
          value = curHintValue;
        }
        if (
          curHintList &&
          curHintList.length &&
          curHintProto === protoName &&
          value === curHintValue
        ) {
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
            hintList = hintList.map(function (item) {
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
        hintTimer = setTimeout(function () {
          var getRemoteHints = getHintCgi(plugin, pluginConf);
          if (!editor._bindedHintEvents) {
            editor._bindedHintEvents = true;
            editor.on('blur', function () {
              waitingRemoteHints = false;
            });
          }
          getRemoteHints(
            {
              protocol: protoName,
              value: value
            },
            function (data) {
              handleRemoteHints(
                data,
                editor,
                plugin,
                protoName,
                value,
                getRemoteHints,
                pluginVars
              );
            }
          );
        }, HINT_TIMEOUT);
      }
    }
    if (
      value ||
      curWord.indexOf('//') !== -1 ||
      !NON_SPECAIL_RE.test(curWord)
    ) {
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
    if (
      !/\s/.test(protocol) &&
      (curWord.indexOf('red') !== 0 ||
        (protocol !== curWord + 'http://' && protocol !== curWord + 'https://'))
    ) {
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
  return {
    list: list,
    from: CodeMirror.Pos(cur.line, start),
    to: CodeMirror.Pos(cur.line, end)
  };
});

CodeMirror.commands.autocomplete = function (cm) {
  cm.showHint({
    hint: CodeMirror.hint.rulesHint,
    completeSingle: false
  });
};

function completeAfter(cm, pred) {
  if (!pred || pred())
    setTimeout(function () {
      if (!cm.state.completionActive) {
        cm.showHint({
          hint: CodeMirror.hint.rulesHint,
          completeSingle: false
        });
      }
    }, 100);
  return CodeMirror.Pass;
}

CHARS.forEach(function (ch) {
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
    } else if (showVarHint) {
      name = '%' + name;
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
      while (--start >= 0) {
        if (/\s/.test(curLine[start])) {
          break;
        }
      }
      ++start;
      while (++end <= len) {
        if (/\s/.test(curLine[end])) {
          break;
        }
      }
      curLine = curLine.slice(start, end);
      if (AT_RE.test(curLine) || P_RE.test(curLine)) {
        name = curLine;
      } else if (PROTOCOL_RE.test(curLine)) {
        name = RegExp.$1;
      }
    }
  }
  return name;
}

exports.getExtraKeys = function () {
  return extraKeys;
};

exports.getHelpUrl = function (editor, options) {
  var name = getFocusRuleName(editor);
  var url;
  if (AT_RE.test(name) && (url = getAtHelpUrl(name.substring(1), options))) {
    return url;
  }
  if (url === false) {
    return false;
  }
  if (
    curValue &&
    (name === curHintProto || curFocusProto === curHintProto) &&
    (url = curHintMap[curValue])
  ) {
    return url;
  }
  if (P_VAR_RE.test(name)) {
    name = name.substring(1, RegExp.$1.length + 1);
    var plugin = name && protocols.getPlugin(name);
    plugin = plugin && plugin.homepage;
    return (
      plugin || 'https://avwo.github.io/whistle/plugins.html?plugin=' + name
    );
  }
  return protocols.getHelpUrl(name);
};
