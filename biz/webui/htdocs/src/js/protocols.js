var events = require('./events');
var PROTOCOLS = ['rule', 'plugin', 'host', 'xhost', 'proxy', 'xproxy', 'http-proxy',
  'xhttp-proxy', 'https-proxy', 'xhttps-proxy', 'socks', 'xsocks',
  'pac', 'weinre', 'log', 'filter', 'ignore', 'enable', 'disable', 'delete',
  'urlParams', 'pathReplace', 'method', 'statusCode',
  'replaceStatus', 'referer', 'auth', 'ua', 'cache', 'redirect',
  'attachment', 'forwardedFor', 'responseFor', 'reqMerge', 'resMerge',
  'reqScript', 'resScript', 'reqDelay', 'resDelay', 'reqSpeed', 'resSpeed',
  'reqHeaders', 'resHeaders', 'reqType', 'resType', 'reqCharset',
  'resCharset', 'reqCookies', 'resCookies', 'reqCors', 'resCors', 'reqPrepend', 'resPrepend',
  'reqBody', 'resBody', 'reqAppend', 'resAppend', 'reqReplace', 'resReplace',
  'htmlPrepend', 'htmlBody', 'htmlAppend', 'cssPrepend', 'cssBody',
  'cssAppend', 'jsPrepend', 'jsBody', 'jsAppend', 'reqWrite', 'resWrite',
  'reqWriteRaw', 'resWriteRaw'
];

var groups = {
  'Set Hosts': ['host://', 'xhost://'],
  'Set Proxy': ['pac://', 'http-proxy://', 'xhttp-proxy://', 'https-proxy://', 'xhttps-proxy://',
    'socks://', 'xsocks://'],
  'Map Local': ['file://', 'xfile://', 'tpl://', 'xtpl://', 'rawfile://', 'xrawfile://'],
  'Map Remote': ['http://', 'https://', 'ws://', 'wss://', 'tunnel://', 'auto'],
  'Modify URL': ['urlParams://', 'pathReplace://', 'redirect://'],
  'Modify Method': ['method://'],
  'Modify StatusCode': ['statusCode://', 'replaceStatus://'],
  'Modify Cors': ['reqCors://', 'resCors://'],
  'Modify Type': ['reqType://', 'resType://', 'attachment://'],
  'Modify Cookies': ['reqCookies://', 'resCookies://'],
  'Modify IP': ['forwardedFor://', 'responseFor://'],
  'Modify Headers': ['delete://', 'ua://', 'auth://', 'referer://', 'reqHeaders://', 'resHeaders://'],
  'Modify Body': ['reqMerge://', 'resMerge://', 'reqReplace://', 'resReplace://'],
  'Inject Html': ['htmlPrepend://', 'htmlBody://', 'htmlAppend://'],
  'Inject Js': ['jsPrepend://', 'jsBody://', 'jsAppend://'],
  'Inject Css': ['cssPrepend://', 'cssBody://', 'cssAppend://'],
  'Inject Body': ['reqPrepend://', 'resPrepend://', 'reqBody://', 'resBody://', 'reqAppend://',
    'resAppend://', 'reqReplace://', 'resReplace://'],
  Tools: ['log://', 'weinre://', 'cache://'],
  Throttle: ['reqDelay://', 'resDelay://', 'reqSpeed://', 'resSpeed://'],
  Settings: ['enable://', 'disable://'],
  Script: ['reqScript://', 'resScript://'],
  Filter: ['ignore://', 'excludeFilter://', 'includeFilter://'],
  Plugin: []
};

var innerRules = ['file', 'xfile', 'tpl', 'xtpl', 'rawfile', 'xrawfile'];
var pluginRules = [];
var forwardRules = innerRules.slice();
var webProtocols = ['http', 'https', 'ws', 'wss', 'tunnel'];
var allInnerRules = webProtocols.concat(innerRules).concat(PROTOCOLS.slice(1));
allInnerRules.splice(allInnerRules.indexOf('plugin'), 1);
var allRules = allInnerRules = allInnerRules.map(function (name) {
  return name + '://';
});
allRules.splice(allRules.indexOf('filter://'), 1, 'excludeFilter://', 'includeFilter://');
var plugins = {};
var allGroupProtocols = [];

Object.keys(groups).forEach(function(key) {
  var list = groups[key];
  list.forEach(function(item) {
    allGroupProtocols.push(item.value || item);
  });
});

exports.groups = groups;
exports.existsProtocol = function(protocol) {
  if (!protocol) {
    return false;
  }
  return allGroupProtocols.indexOf(protocol) !== -1 || groups.Plugin.indexOf(protocol) !== -1;
};
exports.setPlugins = function (pluginsState) {
  var pluginsOptions = pluginsState.pluginsOptions;
  var disabledPlugins = pluginsState.disabledPlugins;
  plugins = {};
  pluginRules = [];
  forwardRules = innerRules.slice();
  allRules = allInnerRules.slice();
  groups.Plugin = [];

  if (!pluginsState.disabledAllPlugins && !pluginsState.disabledAllRules) {
    pluginsOptions.forEach(function (plugin, i) {
      if (!i) {
        return;
      }
      var name = plugin.name;
      plugins[name] = plugin;
      if (!disabledPlugins[name]) {
        forwardRules.push(name);
        pluginRules.push('whistle.' + name, 'plugin.' + name);
        name += '://';
        allRules.push(name, 'whistle.' + name);
        groups.Plugin.push(name, 'whistle.' + name);
      }
    });
  }
  groups.Plugin.push('+Custom');
  events.trigger('updatePlugins');
};

exports.PROTOCOLS = PROTOCOLS;

exports.getForwardRules = function () {
  return forwardRules;
};

exports.getPluginRules = function () {
  return pluginRules;
};

exports.getAllRules = function () {
  return allRules;
};

var ROOT_HELP_URL = 'https://avwo.github.io/whistle/rules/';
exports.getHelpUrl = function (rule) {
  if (!rule || rule === 'rule') {
    return ROOT_HELP_URL;
  }
  if (rule === 'includeFilter' || rule === 'excludeFilter') {
    return ROOT_HELP_URL + 'filter.html';
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
  if (pluginRules.indexOf(rule) !== -1) {
    rule = rule.substring(rule.indexOf('.') + 1);
  }
  rule = plugins[rule];
  if (rule && rule.homepage) {
    return rule.homepage;
  }
  return ROOT_HELP_URL;
};
