var events = require('./events');
var PROTOCOLS = ['host', 'rule', 'weinre', 'log', 'proxy', 'xproxy', 'http-proxy', 'xhttp-proxy',
                'socks', 'xsocks', 'pac', 'filter', 'ignore', 'enable', 'disable', 'delete',
                 'plugin', 'dispatch', 'urlParams', 'urlReplace', 'method', 'statusCode',
                 'replaceStatus', 'hostname', 'referer', 'accept', 'auth', 'etag', 'ua',
                  'cache', 'redirect', 'location', 'attachment', 'forwardedFor', 'responseFor',
                  'reqMerge', 'resMerge',
                  'reqScript', 'resScript', 'reqDelay', 'resDelay', 'reqSpeed', 'resSpeed',
                  'reqHeaders', 'resHeaders', 'reqType', 'resType', 'reqCharset', 'resCharset',
                  'reqCookies', 'resCookies', 'reqCors', 'resCors', 'reqPrepend', 'resPrepend',
                  'reqBody', 'resBody', 'reqAppend', 'resAppend', 'reqReplace', 'resReplace',
                  'htmlPrepend', 'cssPrepend', 'jsPrepend', 'htmlBody', 'cssBody', 'jsBody',
                  'htmlAppend', 'cssAppend', 'jsAppend', 'req', 'res', 'reqWrite',  'resWrite',
                  'reqWriteRaw', 'resWriteRaw', 'exportsUrl', 'exports'];

var innerRules = ['file', 'xfile', 'tpl', 'xtpl', 'rawfile', 'xrawfile'];
var pluginRules = [];
var forwardRules = innerRules.slice();
var webProtocols = ['http', 'https', 'ws', 'wss', 'tunnel'];
var allInnerRules = PROTOCOLS.slice(0, 1).concat(webProtocols).concat(innerRules).concat(PROTOCOLS.slice(2));
allInnerRules.splice(allInnerRules.indexOf('plugin'), 1);
var allRules = allInnerRules = allInnerRules.map(function(name) {
  return name + '://';
});
var plugins = {};

exports.setPlugins = function(pluginsState) {
  var pluginsOptions = pluginsState.pluginsOptions;
  var disabledPlugins = pluginsState.disabledPlugins;
  plugins = {};
  pluginRules = [];
  forwardRules = innerRules.slice();
  allRules = allInnerRules.slice();
  if (!pluginsState.disabledAllPlugins) {
    pluginsOptions.forEach(function(plugin, i) {
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
      }
    });
  }
  events.trigger('updatePlugins');
};

exports.PROTOCOLS = PROTOCOLS;

exports.getForwardRules = function() {
  return forwardRules;
};

exports.getPluginRules = function() {
  return pluginRules;
};

exports.getAllRules = function() {
  return allRules;
};

var ROOT_HELP_URL = 'https://avwo.github.io/whistle/rules/';
exports.getHelpUrl = function(rule) {
  if (!rule || rule === 'rule') {
    return ROOT_HELP_URL;
  }
  if (innerRules.indexOf(rule) !== -1) {
    return ROOT_HELP_URL + 'rule/' + rule + '.html';
  }
  if (webProtocols.indexOf(rule) !== -1) {
    return ROOT_HELP_URL + 'rule/replace.html';
  }
  if (PROTOCOLS.indexOf(rule) !== -1) {
    return ROOT_HELP_URL + rule + '.html';
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
