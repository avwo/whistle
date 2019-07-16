var protocols = ['G', 'style', 'host', 'rule', 'pipe', 'weinre', 'proxy',
  'https2http-proxy', 'http2https-proxy', 'internal-proxy', 'pac', 'filter',
  'ignore', 'enable', 'disable', 'delete', 'log', 'plugin',
  'referer', 'auth', 'ua', 'urlParams', 'params', 'resMerge', 'statusCode', 'replaceStatus',
  'redirect', 'method', 'cache', 'attachment', 'forwardedFor', 'responseFor',
  'rulesFile', 'resScript', 'reqDelay', 'resDelay', 'headerReplace',
  'reqSpeed', 'resSpeed', 'reqType', 'resType', 'reqCharset',
  'resCharset', 'reqCookies', 'resCookies', 'reqCors', 'resCors',
  'reqHeaders', 'resHeaders', 'reqPrepend', 'resPrepend', 'reqBody',
  'resBody', 'reqAppend', 'resAppend', 'urlReplace', 'reqReplace',
  'resReplace', 'reqWrite', 'resWrite', 'reqWriteRaw', 'resWriteRaw',
  'cssAppend', 'htmlAppend', 'jsAppend', 'cssBody', 'htmlBody', 'jsBody',
  'cssPrepend', 'htmlPrepend', 'jsPrepend'
];

var RULE_RE = /^(?:|x|xs)(?:file|rawfile|dust|tpl|jsonp):$/;
var PROXY_RE = /^x?(?:socks|proxy|https?-proxy|internal-proxy|https2http-proxy|http2https-proxy)$/;
var resProtocols = ['filter', 'disable', 'ignore', 'replaceStatus', 'statusCode',
  'cache', 'attachment', 'delete', 'resMerge', 'resDelay', 'headerReplace',
  'resSpeed', 'resType', 'resType', 'resCharset', 'resCookies', 'resCors',
  'resHeaders', 'resPrepend', 'resBody', 'resAppend', 'resReplace',
  'resWrite', 'resWriteRaw', 'cssAppend', 'htmlAppend', 'jsAppend', 'cssBody',
  'htmlBody', 'jsBody', 'cssPrepend', 'htmlPrepend', 'jsPrepend',
  'responseFor', 'style'
];
var binProtocols = ['reqPrepend', 'resPrepend', 'reqBody', 'resBody', 'reqAppend', 'resAppend'];
var jsProtocols = ['jsAppend', 'jsBody', 'jsPrepend'];
var cssProtocols = ['cssAppend', 'cssBody', 'cssPrepend'];
var aliasProtocols = {
  ruleFile: 'rulesFile',
  ruleScript: 'rulesFile',
  rulesScript: 'rulesFile',
  reqScript: 'rulesFile',
  pathReplace: 'urlReplace',
  download: 'attachment',
  'http-proxy': 'proxy',
  'xhttp-proxy': 'xproxy',
  status: 'statusCode',
  hosts: 'host',
  xhost: 'host',
  html: 'htmlAppend',
  js: 'jsAppend',
  reqMerge: 'params',
  css: 'cssAppend',
  excludeFilter: 'filter',
  includeFilter: 'filter'
};

exports.multiMatchs = [
  'ignore', 'enable', 'filter', 'disable', 'plugin', 'delete', 'style',
  'urlParams', 'params', 'headerReplace', 'reqHeaders', 'resHeaders', 'reqCors', 'resCors',
  'reqCookies', 'resCookies', 'reqReplace', 'urlReplace', 'resReplace',
  'resMerge', 'reqBody', 'reqPrepend', 'resPrepend', 'reqAppend', 'resAppend',
  'resBody', 'htmlAppend', 'jsAppend', 'cssAppend', 'htmlBody', 'jsBody',
  'cssBody', 'htmlPrepend', 'jsPrepend', 'cssPrepend'
];
exports.protocols = protocols;
exports.resProtocols = resProtocols;
exports.aliasProtocols = aliasProtocols;

function getRules() {
  return resetRules({});
}

exports.getRules = getRules;

function isBinProtocol(protocol) {
  if (binProtocols.indexOf(protocol) != -1) {
    return 1;
  }
  if (jsProtocols.indexOf(protocol) != -1) {
    return 2;
  }
  if (cssProtocols.indexOf(protocol) != -1) {
    return 3;
  }
}

exports.isBinProtocol = isBinProtocol;

function resetRules(rules) {
  protocols.forEach(function (protocol) {
    rules[protocol] = [];
  });
  rules._localRule = [];
  rules._bodyFilters = [];
  return rules;
}

exports.resetRules = resetRules;

function isResRule(protocol) {
  return resProtocols.indexOf(protocol) != -1;
}

exports.isResRule = isResRule;

function isWebProtocol(protocol) {
  return protocol == 'http:' || protocol == 'https:';
}

exports.isWebProtocol = isWebProtocol;

function isWebsocketProtocol(protocol) {
  return protocol == 'ws:' || protocol == 'wss:';
}

exports.isWebsocketProtocol = isWebsocketProtocol;

function isFileProxy(protocol) {
  return RULE_RE.test(protocol);
}

exports.isFileProxy = isFileProxy;

function contains(name) {
  if (protocols.indexOf(name) != -1 || aliasProtocols[name] || PROXY_RE.test(name)) {
    return true;
  }
  name += ':';
  return isWebsocketProtocol(name) || isWebProtocol(name) || isFileProxy(name) ||
    name == 'tunnel:';
}

exports.contains = contains;
