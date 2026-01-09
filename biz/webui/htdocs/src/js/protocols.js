var util = require('./util');
var events = require('./events');
var PROTOCOLS = [
  'rule',
  'style',
  'pipe',
  'plugin',
  'sniCallback',
  'host',
  'xhost',
  'proxy',
  'xproxy',
  'http-proxy',
  'xhttp-proxy',
  'https-proxy',
  'xhttps-proxy',
  'socks',
  'xsocks',
  'pac',
  'log',
  'weinre',
  'filter',
  'ignore',
  'skip',
  'enable',
  'disable',
  'delete',
  'urlParams',
  'pathReplace',
  'method',
  'replaceStatus',
  'reqScript',
  'resScript',
  'frameScript',
  'reqDelay',
  'resDelay',
  'reqSpeed',
  'resSpeed',
  'headerReplace',
  'reqHeaders',
  'resHeaders',
  'reqCharset',
  'resCharset',
  'reqCookies',
  'resCookies',
  'reqCors',
  'resCors',
  'reqType',
  'resType',
  'ua',
  'auth',
  'cache',
  'referer',
  'attachment',
  'forwardedFor',
  'responseFor',
  'reqBody',
  'resBody',
  'reqMerge',
  'resMerge',
  'reqPrepend',
  'resPrepend',
  'reqAppend',
  'resAppend',
  'reqReplace',
  'resReplace',
  'htmlPrepend',
  'htmlBody',
  'htmlAppend',
  'cssPrepend',
  'cssBody',
  'cssAppend',
  'jsPrepend',
  'jsBody',
  'jsAppend',
  'reqWrite',
  'resWrite',
  'reqWriteRaw',
  'resWriteRaw',
  'trailers',
  'tlsOptions'
];

var innerRules = [
  'file',
  'xfile',
  'tpl',
  'xtpl',
  'rawfile',
  'xrawfile',
  'redirect',
  'locationHref',
  'statusCode'
];
var pluginRules = [];
var pluginNameList = [];
var pluginVarList = [];
var allPluginNameList = [];
var forwardRules = innerRules.slice();
var webProtocols = ['http', 'https', 'ws', 'wss', 'tunnel'];
var allInnerRules = webProtocols.concat(innerRules).concat(PROTOCOLS.slice(1));
allInnerRules.splice(allInnerRules.indexOf('plugin'), 1);
allInnerRules.splice(allInnerRules.indexOf('reqScript') + 1, 0, 'reqRules');
allInnerRules.splice(allInnerRules.indexOf('resScript') + 1, 0, 'resRules');
allInnerRules = allInnerRules.map(function (name) {
  return name + '://';
});
allInnerRules.splice(
  allInnerRules.indexOf('filter://'),
  1,
  'excludeFilter://',
  'includeFilter://'
);
allInnerRules.push('lineProps://');
var allRules = allInnerRules;
var groupRules = [
  ['Map Local', ['file://', 'xfile://', 'tpl://', 'xtpl://', 'rawfile://', 'xrawfile://']],
  ['Map Remote', ['https://', 'http://', 'wss://', 'ws://', 'tunnel://']],
  ['DNS Spoofing', ['host://', 'xhost://', 'proxy://', 'xproxy://', 'http-proxy://', 'xhttp-proxy://',
    'https-proxy://', 'xhttps-proxy://', 'socks://', 'xsocks://', 'pac://']],
  ['Rewrite Request', ['urlParams://', 'pathReplace://','sniCallback://', 'method://', 'tlsOptions://', 'reqHeaders://', 'forwardedFor://',
    'ua://', 'auth://', 'cache://', 'referer://', 'reqType://', 'reqCharset://', 'reqCookies://',
    'reqCors://', 'reqBody://', 'reqMerge://', 'reqPrepend://', 'reqAppend://', 'reqReplace://', 'reqWrite://',
    'reqWriteRaw://', 'reqRules://', 'reqScript://']],
  ['Rewrite Response', ['statusCode://', 'replaceStatus://', 'redirect://', 'locationHref://', 'resHeaders://', 'responseFor://',
    'resCharset://', 'resType://', 'resCookies://', 'attachment://', 'resCors://', 'resBody://', 'resMerge://', 'resPrepend://', 'resAppend://', 'resReplace://',
    'htmlPrepend://', 'htmlBody://', 'htmlAppend://', 'cssPrepend://', 'cssBody://', 'cssAppend://', 'jsPrepend://', 'jsBody://',
    'jsAppend://', 'trailers://', 'resWrite://', 'resWriteRaw://', 'resRules://', 'resScript://', 'frameScript://']],
  ['General', ['pipe://', 'delete://', 'headerReplace://']],
  ['Throttle', ['reqDelay://', 'resDelay://', 'reqSpeed://', 'resSpeed://']],
  ['Tools', ['weinre://', 'log://']],
  ['Settings', ['style://', 'enable://', 'disable://', 'lineProps://']],
  ['Filters', ['ignore://', 'skip://', 'excludeFilter://', 'includeFilter://']],
  ['Plugins', []]
];

var pluginsOptions = [];

exports.setPlugins = function (pluginsState) {
  var disabledPlugins = pluginsState.disabledPlugins;
  pluginsOptions = pluginsState.pluginsOptions;
  pluginRules = [];
  pluginNameList = [];
  pluginVarList = [];
  allPluginNameList = [];
  forwardRules = innerRules.slice();
  allRules = allInnerRules.slice();
  var pluginsProtos = [];
  groupRules[groupRules.length - 1][1] = pluginsProtos;

  if (!pluginsState.disabledAllPlugins) {
    pluginsOptions.forEach(function (plugin, i) {
      if (!i) {
        return;
      }
      var name = plugin.name;
      if (!disabledPlugins[name]) {
        var vars = plugin.pluginVars;
        if (vars) {
          pluginNameList.push(name);
          var hintSuffix = vars.hintSuffix;
          if (hintSuffix) {
            hintSuffix.forEach(function(suffix) {
              pluginVarList.push('%' + name + suffix);
            });
          } else {
            pluginVarList.push('%' + name + '=');
          }
        }
        allPluginNameList.push(name);
        var proto;
        if (!plugin.hideShortProtocol && name.indexOf('_') === -1) {
          forwardRules.push(name);
          proto = name + '://';
          allRules.push(proto);
          pluginsProtos.push(proto);
        }
        if (!plugin.hideLongProtocol) {
          pluginRules.push('whistle.' + name, 'plugin.' + name);
          proto = 'whistle.' + name + '://';
          allRules.push(proto);
          pluginsProtos.push(proto);
        }
      }
    });
  }
  events.trigger('updatePlugins');
};

exports.PROTOCOLS = PROTOCOLS;

exports.getGroupRules = function() {
  return groupRules;
};

exports.getForwardRules = function () {
  return forwardRules;
};

exports.getPluginRules = function () {
  return pluginRules;
};


exports.getPluginNameList = function () {
  return pluginNameList;
};

exports.getPluginVarList = function() {
  return pluginVarList;
};

exports.getAllPluginNameList = function () {
  return allPluginNameList;
};

exports.getAllRules = function () {
  return allRules;
};

function getPlugin(rule) {
  rule = rule.substring(rule.indexOf('.') + 1);
  for (var i = 0, len = pluginsOptions.length; i < len; i++) {
    var plugin = pluginsOptions[i];
    if (plugin.name === rule) {
      return plugin;
    }
  }
}

exports.getHelpUrl = function (rule) {
  if (!rule || rule === 'rule') {
    return util.getDocUrl('rules/protocols.html');
  }
  if (rule === 'includeFilter' || rule === 'excludeFilter') {
    return util.getDocUrl('rules/filters.html');
  }
  if (rule === 'skip') {
    return util.getDocUrl('rules/skip.html');
  }
  if (rule === 'lineProps') {
    return util.getDocUrl('rules/lineProps.html');
  }
  if (rule === 'reqRules') {
    return util.getDocUrl('rules/reqRules.html');
  }
  if (rule === 'resRules') {
    return util.getDocUrl('rules/resRules.html');
  }
  if (innerRules.indexOf(rule) !== -1 || webProtocols.indexOf(rule) !== -1 || PROTOCOLS.indexOf(rule) !== -1) {
    if (rule === 'http-proxy') {
      rule = 'proxy';
    } else if (rule === 'xhttp-proxy') {
      rule = 'xproxy';
    } else if (rule === 'tlsOptions') {
      rule = 'cipher';
    }
    return util.getDocUrl('rules/' + rule + '.html');
  }
  rule = getPlugin(rule);
  if (rule && rule.homepage) {
    return rule.homepage;
  }
  return util.getDocUrl('rules/protocols.html');
};

exports.getPlugin = getPlugin;
