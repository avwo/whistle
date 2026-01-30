require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint.js');
var $ = require('jquery');
var CodeMirror = require('codemirror');
var protocols = require('./protocols');
var dataCenter = require('./data-center');
var util = require('./util');

var disabledEditor = window.location.href.indexOf('disabledEditor=1') !== -1;
var NON_SPECAIL_RE = /[^:/]/;
var PLUGIN_NAME_RE = /^((?:whistle\.)?([a-z\d_-]+:))(\/?$|\/\/)/;
var MAX_HINT_LEN = 512;
var MAX_VAR_LEN = 100;
var AT_RE = /^@/;
var P_RE = /^%/;
var P_VAR_RE = /^%([a-z\d_-]+)([=.])/;
var VAL_RE = /^([a-z\d_.-]+:\/\/)?(`)?\{([^\s]*?)(?:\}\1?)?$/i;
var PROTOCOL_RE = /^([^\s:]+):\/\//;
var VALUE_RE = /^\s*```/;
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
var FILTERS = [
  '<keyword or regexp of url>',
  'm:<keyword or regexp of request method>',
  'b:<keyword or regexp of request body>',
  's:<keyword or regexp of response status code>',
  'clientIp:<keyword or regexp of client ip>',
  'serverIp:<keyword or regexp of server ip>',
  'chance:<probability [0, 1]>',
  'reqH.headerKey=<keyword or regexp of request header key value>',
  'resH.headerKey=<keyword or regexp of response header key value>'
];
var HEADERS = [
  'reqH.headerKey:keywordOrRegExp=<replacement value>',
  'resH.headerKey:keywordOrRegExp=<replacement value>',
  'trailer.headerKey:keywordOrRegExp=<replacement value>'
];
var DEL_HINTS = [
  'pathname.<index>',
  'urlParams.<url param key>',
  'reqHeaders.<request header key>',
  'resHeaders.<response header key>',
  'reqCookies.<request cookie key>',
  'resCookies.<response cookie key>',
  'reqBody.<object key path: k1.k2.k3>',
  'resBody.<object key path: k1.k2.k3>',
  'pathname',
  'urlParams',
  'reqType',
  'resType',
  'reqCharset',
  'resCharset',
  'reqBody',
  'resBody'
];

var LINE_PROPS_HINTS = ['important', 'safeHtml', 'strictHtml', 'disableAutoCors', 'disableUserLogin', 'enableUserLogin',
  'internal', 'internalOnly', 'internalProxy', 'proxyFirst', 'proxyHost', 'proxyHostOnly', 'proxyTunnel', 'weakRule', 'enableBigData'];

var ENABLE_HINTS = ['abort', 'abortReq', 'abortRes', 'authCapture', 'auto2http', 'bigData', 'br', 'gzip', 'deflate',
  'capture', 'captureIp', 'captureStream', 'clientCert', 'clientId', 'clientIp', 'customParser', 'flushHeaders', 'forHttp', 'forHttps',
  'forceReqWrite', 'forceResWrite', 'h2', 'http2', 'httpH2', 'hide', 'hideComposer', 'hideCaptureError', 'showHost', 'ignoreSend', 'ignoreReceive',
  'pauseSend', 'pauseReceive', 'inspect', 'interceptConsole', 'internalProxy', 'proxyFirst', 'proxyHost', 'proxyTunnel', 'keepCSP', 'keepAllCSP', 'keepCache',
  'keepAllCache', 'keepClientId', 'safeHtml', 'strictHtml', 'multiClient', 'reqMergeBigData', 'resMergeBigData', 'requestWithMatchedRules', 'responseWithMatchedRules', 'tunnelHeadersFirst',
  'useLocalHost', 'useSafePort', 'userLogin', 'weakRule', 'socket', 'websocket'];
var DISABLE_HINTS = ['301', 'abort', 'abortReq', 'abortRes', 'authCapture', 'auto2http', 'autoCors',  'ajax', 'bigData', 'capture', 'captureIp', 'captureStream',
  'clientCert', 'clientId', 'clientIp', 'customParser', 'cache', 'dnsCache', 'csp', 'cookies', 'reqCookies', 'resCookies', 'flushHeaders', 'forHttp', 'forHttps', 'forceReqWrite',
  'forceResWrite', 'gzip', 'h2', 'http2', 'httpH2', 'hide', 'hideComposer', 'hideCaptureError', 'interceptConsole', 'internalProxy', 'proxyFirst',
  'proxyHost', 'proxyTunnel', 'keepCSP', 'keepAllCSP', 'keepCache', 'keepAllCache', 'keepAlive', 'keepClientId', 'keepH2Session', 'safeHtml', 'strictHtml',
  'multiClient', 'proxyConnection', 'ua', 'proxyUA', 'referer', 'rejectUnauthorized', 'reqMergeBigData', 'resMergeBigData', 'requestWithMatchedRules', 'responseWithMatchedRules', 'secureOptions', 'servername',
  'timeout', 'trailerHeader', 'trailers', 'tunnelAuthHeader', 'tunnelHeadersFirst', 'useLocalHost', 'useSafePort', 'userLogin', 'weakRule'];
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

function isExactMatch(curWord, list) {
  var item = list && list.length === 1 && list[0];
  return item && (item.text || item) === curWord;
}

var curKeys;
var curRules;

function getInlineKeys() {
  var rulesModal = dataCenter.rulesModal;
  var list = rulesModal && rulesModal.getSelectedList();
  var active = rulesModal && rulesModal.getActive();
  if (active) {
    if (!list) {
      list = [active];
    } else if (list.indexOf(active) === -1) {
      list.push(active);
    }
  }
  var value = list && list.map(function(item) {
    return item.value;
  }).join('\n');
  if (!value) {
    return;
  }
  if (curRules !== value) {
    curRules = value;
    var values = {};
    util.resolveInlineValues(curRules, values);
    curKeys = Object.keys(values);
    if (!curKeys.length) {
      curKeys = null;
    }
  }
  return curKeys;
}

function getHintCgi(plugin, pluginVars) {
  var moduleName = plugin.moduleName;
  var url = (pluginVars && pluginVars.hintUrl) || plugin.hintUrl || '';
  var pluginName = 'plugin.' + util.getSimplePluginName(plugin);
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
    return name.indexOf(keyword) !== -1 || (name === 'tlsoptions://' && 'cipher://'.indexOf(keyword) !== -1);
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
  var index1 = list.indexOf('redirect://');
  var index2 = list.indexOf('locationHref://');
  if (index1 !== -1) {
    if (index2 !== -1) {
      if (index1 > index2) {
        list.splice(index1, 1);
        list.splice(index2 + 1, 0, 'redirect://');
      } else {
        list.splice(index2, 1);
        list.splice(index1 + 1, 0, 'locationHref://');
      }
    } else {
      list.splice(index1 + 1, 0, 'locationHref://');
    }
  } else if (index2 !== -1) {
    list.splice(index2 + 1, 0, 'redirect://');
  }
  return list;
}

function getFilterHint(filter) {
  var index = filter.indexOf('<');
  return {
    text: index === -1 ? filter : filter.substring(0, index),
    displayText: filter
  };
}

function getFilterHints(keyword, filter1, filter2) {
  keyword = keyword.toLowerCase();
  if (/[:=]/.test(keyword)) {
    return [];
  }
  var filters1 = [];
  var filters2 = [];
  FILTERS.forEach(function(filter, i) {
    if (!keyword || (i && filter.toLowerCase().indexOf(keyword) !== -1)) {
      filters1.push(getFilterHint(filter1 + filter));
      if (filter2) {
        filters2.push(getFilterHint(filter2 + filter));
      }
    }
  });
  return filters1.concat(filters2);
}

function getSpecHints(keyword, protocol, hints) {
  var getHint = function(hint) {
    hint = protocol + hint;
    var index = hint.indexOf('<');
    return {
      text: index === -1 ? hint : hint.substring(0, index),
      displayText: hint
    };
  };
  if (!keyword) {
    return hints.map(getHint);
  }
  var result = [];
  keyword = keyword.toLowerCase();
  hints.forEach(function (hint) {
    if (hint.toLowerCase().indexOf(keyword) !== -1) {
      result.push(getHint(hint));
    }
  });
  return result;
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

function getSpecHint(name, specProto) {
  return {
    text: name,
    displayText: name + '(' + (specProto === 'pipe' ? 'pipe' : 'sni') + 'Value)'
  };
}

function getPluginVarHints(keyword, specProto) {
  var originalKeyword = keyword;
  var list;
  if (specProto) {
    keyword = keyword.substring(specProto.length + 3);
    list = protocols.getAllPluginNameList().map(function (name) {
      return specProto + '://' + name;
    });
  } else {
    keyword = keyword.substring(1);
    list = protocols.getPluginVarList();
  }
  if (!keyword) {
    return specProto ? list.map(function(name) {
      return getSpecHint(name, specProto);
    }) : list;
  }
  keyword = keyword.toLowerCase();
  if (specProto) {
    keyword = specProto + '://' + keyword;
    var result = [];
    list.filter(function (name) {
      if (name.indexOf(keyword) !== -1) {
        result.push(getSpecHint(name, specProto));
      }
    });
    return result.length === 1 && result[0].text === originalKeyword ? [] : result;
  }
  return list.filter(function (name) {
    return name.indexOf(keyword) !== -1;
  });
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
  return util.getDocUrl('rules/@.html');
}

function getRuleHelp(plugin, helpUrl) {
  if (typeof helpUrl !== 'string') {
    helpUrl = '';
  }
  return (
    helpUrl || plugin.homepage || util.getDocUrl('extensions/usage.html')
  );
}

function getHintText(protoName, text, isVar, isKey) {
  if (!isVar) {
    return protoName + '://' + text;
  }
  return protoName + (isKey ? '.' : '=') + text;
}

function handleRemoteHints(data, editor, plugin, protoName, value, cgi, isVar, curWord) {
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
      var label = item.label || item.displayText || item.display;
      var curVal = item.value || item.text;
      label = typeof label === 'string' ? label.trim() : '';
      curVal = typeof curVal === 'string' ? curVal.trim() : '';
      if (curVal) {
        curVal = getHintText(protoName, curVal, isVar, item.isKey);
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
  if (isExactMatch(curWord, curHintList)) {
    curHintList = [];
    len = 0;
  }
  if (waitingRemoteHints && len) {
    editor._byPlugin = true;
    editor.execCommand('autocomplete');
  }
}

function isFilterProtocol(name) {
  return name === 'includeFilter://' || name === 'excludeFilter://';
}

function getSpecProto(keyword) {
  if (!keyword) {
    return;
  }
  if (!keyword.indexOf('pipe://')) {
    return 'pipe';
  }
  if (!keyword.indexOf('sniCallback://')) {
    return 'sniCallback';
  }
  if (keyword.indexOf('://') !== -1) {
    return;
  }
  keyword = keyword.toLowerCase();
  var isPipe = 'pipe://'.indexOf(keyword) !== -1;
  if (!isPipe && 'snicallback://'.indexOf(keyword) === -1) {
    return;
  }
  var allRules = protocols.getAllRules();
  var curProto = isPipe ? 'pipe://' : 'sniCallback://';
  for (var i = 0, len = allRules.length; i < len; i++) {
    var rule = allRules[i];
    if (rule !== curProto && rule.toLowerCase().indexOf(keyword) !== -1) {
      return;
    }
  }

  return isPipe ? 'pipe' : 'sniCallback';
}

function getSpecHintOptions(list) {
  var len = list.length;
  var rule = len === 1 ? list[0] : '';
  if (!rule) {
    return;
  }
  if (rule.indexOf('headerReplace://') === 0) {
    return {
      isHeader: true,
      protocol: 'headerReplace://',
      hints: HEADERS
    };
  }
  if (rule.indexOf('delete://') === 0) {
    return {
      isDelete: true,
      protocol: 'delete://',
      hints: DEL_HINTS
    };
  }
  if (rule.indexOf('lineProps://') === 0) {
    return {
      isLineProps: true,
      protocol: 'lineProps://',
      hints: LINE_PROPS_HINTS
    };
  }
  if (rule.indexOf('enable://') === 0) {
    return {
      isEnable: true,
      protocol: 'enable://',
      hints: ENABLE_HINTS
    };
  }
  if (rule.indexOf('disable://') === 0) {
    return {
      isDisable: true,
      protocol: 'disable://',
      hints: DISABLE_HINTS
    };
  }
}

var WORD = /\S+/;
var HTTP_RE = /^https?:\/?\/?/;
var SPEC_HINT_RE = /^(headerReplace|includeFilter|excludeFilter|delete|lineProps|enable|disable):\/\//;
var showAtHint;
var showVarHint;
var canShowHint;
var toValKey = function(key, tpl) {
  return tpl + '{' + key + '}' + tpl;
};
CodeMirror.registerHelper('hint', 'rulesHint', function (editor) {
  showAtHint = false;
  showVarHint = false;
  waitingRemoteHints = false;
  curFocusProto = null;
  var hasShownHint = canShowHint;
  canShowHint = false;
  var byDelete = editor._byDelete || editor._byPlugin;
  var byEnter = editor._byEnter;
  editor._byDelete = editor._byPlugin = editor._byEnter = false;
  var cur = editor.getCursor();
  var curLine = editor.getLine(cur.line);
  if (VALUE_RE.test(curLine)) {
    return;
  }
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
  var curWord = start == end ? '' : curLine.substring(start, end);
  var isAt = AT_RE.test(curWord);
  var plugin;
  var pluginName;
  var value;
  var pluginVars;
  var sep;
  var specProto = getSpecProto(curWord);
  var isPluginVar = P_RE.test(curWord);
  var isPluginKey;
  if (isPluginVar && P_VAR_RE.test(curWord)) {
    pluginName = RegExp.$1;
    sep = RegExp.$2;
    plugin = pluginName && dataCenter.getPlugin(pluginName + ':');
    pluginVars = plugin && plugin.pluginVars;
    if (!pluginVars) {
      return;
    }
    value = curWord.substring(pluginName.length + 2);
    isPluginVar = sep === '.';
    isPluginKey = isPluginVar;
  }

  if (isAt || specProto || isPluginVar) {
    if (!byEnter || isPluginKey || /^(?:pipe|sniCallback):\/\/$/.test(curWord)) {
      list = isAt
        ? getAtValueList(curWord)
        : getPluginVarHints(curWord, specProto);
    }
    var varLen = list && list.length;
    var onlyOne = isExactMatch(curWord, list);
    var noHint = !varLen || onlyOne;
    if (isPluginKey) {
      if (onlyOne && /=./.test(value)) {
        return;
      }
    } else if (noHint) {
      return;
    }
    if (isAt) {
      showAtHint = true;
    } else if (isPluginVar) {
      showVarHint = true;
    }
    if (!noHint) {
      return {
        list: list,
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, end)
      };
    }
    if (onlyOne) {
      byEnter = false;
    }
  }
  if (curWord) {
    if (VAL_RE.test(curWord)) {
      var protoLen = RegExp.$1.length;
      var tplStart = RegExp.$2;
      var valKeyword = RegExp.$3;
      var valuesModal = dataCenter.getValuesModal();
      var valuesKeys = valuesModal && valuesModal.list;
      var inlineKyes = getInlineKeys();
      if (inlineKyes) {
        if (valuesKeys) {
          valuesKeys.forEach(function(key) {
            if (inlineKyes.indexOf(key) === -1) {
              inlineKyes.push(key);
            }
          });
        }
        valuesKeys = inlineKyes;
      }
      if (valKeyword.slice(-2) === '}`') {
        valKeyword = valKeyword.slice(0, -2);
      }
      if (valuesKeys && valuesKeys.length) {
        if (valKeyword) {
          list = [];
          var lowerKey = valKeyword.toLowerCase();
          valuesKeys.forEach(function(key) {
            var lk = key.toLowerCase();
            if (lk === lowerKey) {
              list.unshift(toValKey(key, tplStart));
            } else if (lk.indexOf(lowerKey) !== -1) {
              list.push(toValKey(key, tplStart));
            }
          });
        } else {
          list = valuesKeys.map(function(key) {
            return toValKey(key, tplStart);
          });
        }
        var valLen = list && list.length;
        if (valLen) {
          if (isExactMatch(curWord.substring(protoLen), list)) {
            return;
          }
          curLine = curLine.substring(start).split(/\s/, 1)[0] || '';
          return {
            list: list,
            from: CodeMirror.Pos(cur.line, start + protoLen),
            to: CodeMirror.Pos(cur.line, start + curLine.length)
          };
        }
      }
    }
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
                hint = {
                  text: text,
                  displayText: item.displayText
                };
                text = item.displayText;
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
          curLine = curLine.substring(start).split(/\s/, 1)[0] || '';
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
          var hintOpts = {
            protocol: protoName,
            value: value
          };
          if (sep) {
            hintOpts.sep = sep;
          }
          getRemoteHints(hintOpts,
            function (data) {
              handleRemoteHints(
                data,
                editor,
                plugin,
                protoName,
                value,
                getRemoteHints,
                pluginVars,
                curWord
              );
            }
          );
        }, HINT_TIMEOUT);
      }
    }
    var isSpecHint = SPEC_HINT_RE.test(curWord);
    if (value || (isSpecHint ? (byEnter && hasShownHint) : curWord.indexOf('//') !== -1) || !NON_SPECAIL_RE.test(curWord)) {
      return;
    }
  } else if (byDelete) {
    return;
  }
  var filterName;
  if (isSpecHint) {
    var slashIdx = curWord.indexOf('://') + 3;
    value = curWord.substring(slashIdx);
    filterName = curWord.substring(0, slashIdx);
  } else {
    value = '';
  }
  list = getHints(filterName || curWord);
  var hintOpts = getSpecHintOptions(list);
  var len = list.length;
  var isFilter = (len === 2 && (isFilterProtocol(list[0]) || isFilterProtocol(list[1]))) || (len === 1 && isFilterProtocol(list[0]));
  isSpecHint = hintOpts || isFilter;
  if (isSpecHint) {
    list = hintOpts ? getSpecHints(value, hintOpts.protocol, hintOpts.hints) : getFilterHints(value, list[0], list[1]);
    len = list.length;
  }
  if (!len) {
    return;
  }
  canShowHint = isSpecHint;
  var last = end;
  var nextCh = curLine[last];
  while (nextCh && WORD.test(nextCh)) {
    nextCh = curLine[++last];
  }
  var curItem = curLine.substring(start, last);
  if (isSpecHint) {
    end = last;
    if (len === 1 && isExactMatch(curItem, list)) {
      return;
    }
  } else {
    var index = curItem.indexOf(':');
    if (index !== -1 && !HTTP_RE.test(curItem.substring(end))) {
      end = start + index + 1;
      if (curLine[end] === '/') {
        end++;
        if (curLine[end] === '/') {
          end++;
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
      plugin || util.getDocUrl('extensions/usage.html')
    );
  }
  return protocols.getHelpUrl(name);
};
