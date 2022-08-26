var events = require('./events');
var PROTOCOLS = [
  'rule',
  'style',
  'pipe',
  'plugin',
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
  'weinre',
  'log',
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
  'referer',
  'auth',
  'ua',
  'cache',
  'attachment',
  'forwardedFor',
  'responseFor',
  'reqMerge',
  'resMerge',
  'reqScript',
  'resScript',
  'reqDelay',
  'resDelay',
  'reqSpeed',
  'resSpeed',
  'reqHeaders',
  'resHeaders',
  'trailers',
  'reqType',
  'resType',
  'reqCharset',
  'resCharset',
  'reqCookies',
  'resCookies',
  'reqCors',
  'resCors',
  'reqPrepend',
  'resPrepend',
  'reqBody',
  'resBody',
  'reqAppend',
  'resAppend',
  'headerReplace',
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
  'cipher',
  'sniCallback'
];

var innerRules = [
  'file',
  'xfile',
  'tpl',
  'xtpl',
  'rawfile',
  'xrawfile',
  'redirect',
  'statusCode'
];
var pluginRules = [];
var pluginNameList = [];
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
var pluginsOptions = [];

exports.setPlugins = function (pluginsState) {
  var disabledPlugins = pluginsState.disabledPlugins;
  pluginsOptions = pluginsState.pluginsOptions;
  pluginRules = [];
  pluginNameList = [];
  allPluginNameList = [];
  forwardRules = innerRules.slice();
  allRules = allInnerRules.slice();

  if (!pluginsState.disabledAllPlugins) {
    pluginsOptions.forEach(function (plugin, i) {
      if (!i) {
        return;
      }
      var name = plugin.name;
      if (!disabledPlugins[name]) {
        if (plugin.pluginVars) {
          pluginNameList.push(name);
        }
        allPluginNameList.push(name);
        if (!plugin.hideShortProtocol && name.indexOf('_') === -1) {
          forwardRules.push(name);
          allRules.push(name + '://');
        }
        if (!plugin.hideLongProtocol) {
          pluginRules.push('whistle.' + name, 'plugin.' + name);
          allRules.push('whistle.' + name + '://');
        }
      }
    });
  }
  events.trigger('updatePlugins');
};

exports.PROTOCOLS = PROTOCOLS;

exports.getForwardRules = function () {
  return forwardRules;
};

exports.getPluginRules = function () {
  return pluginRules;
};

exports.getPluginNameList = function () {
  return pluginNameList;
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

var ROOT_HELP_URL = 'https://avwo.github.io/whistle/rules/';
exports.getHelpUrl = function (rule) {
  if (!rule || rule === 'rule') {
    return ROOT_HELP_URL;
  }
  if (rule === 'includeFilter' || rule === 'excludeFilter') {
    return ROOT_HELP_URL + 'filter.html';
  }
  if (rule === 'skip') {
    return ROOT_HELP_URL + 'ignore.html';
  }
  if (rule === 'lineProps') {
    return ROOT_HELP_URL + 'lineProps.html';
  }
  if (rule === 'reqRules') {
    return ROOT_HELP_URL + 'reqScript.html';
  }
  if (rule === 'resRules') {
    return ROOT_HELP_URL + 'resScript.html';
  }
  if (innerRules.indexOf(rule) !== -1) {
    return ROOT_HELP_URL + 'rule/' + rule.replace(/^x/, '') + '.html';
  }
  if (webProtocols.indexOf(rule) !== -1) {
    return ROOT_HELP_URL + 'rule/replace.html';
  }
  if (PROTOCOLS.indexOf(rule) !== -1) {
    return ROOT_HELP_URL + rule.replace(/^x/, '') + '.html';
  }
  rule = getPlugin(rule);
  if (rule && rule.homepage) {
    return rule.homepage;
  }
  return ROOT_HELP_URL;
};

exports.getPlugin = getPlugin;
