var net = require('net');
var rules = require('../lib/rules');
var util = require('../lib/util');
var handleUIReq = require('./webui/lib').handleRequest;
var handleWeinreReq = require('./weinre');
var config = require('../lib/config');

var localIpCache = util.localIpCache;
var WEBUI_PATH = config.WEBUI_PATH;
var CUSTOM_WEBUI_PATH = /\/[\w.-]*\.whistle-path\.5b6af7b9884e1165[\w.-]*\/+/;
var CUSTOM_WEBUI_PATH_RE = /^\/[\w.-]*\.whistle-path\.5b6af7b9884e1165[\w.-]*\/+/;
var PREVIEW_PATH_RE = config.PREVIEW_PATH_RE;
var WEBUI_PATH_RE = util.escapeRegExp(WEBUI_PATH);
var REAL_WEBUI_HOST = new RegExp('^' + WEBUI_PATH_RE + '(__([a-z\\d.-]+)(?:__(\\d{1,5}))?__/)');
var INTERNAL_APP = new RegExp('^' + WEBUI_PATH_RE + '(log|weinre|cgi)(?:\\.(\\d{1,5}))?/');
var PLUGIN_RE = new RegExp('^' + WEBUI_PATH_RE + 'whistle\\.([a-z\\d_-]+)/');
var CUSTOM_REAL_WEBUI_HOST = new RegExp('^/[\\w.-]*\\.whistle-path\\.5b6af7b9884e1165[\\w.-]*/+(__([a-z\\d.-]+)(?:__(\\d{1,5}))?__/)');
var CUSTOM_INTERNAL_APP = new RegExp('^/[\\w.-]*\\.whistle-path\\.5b6af7b9884e1165[\\w.-]*/+(log|weinre|cgi)(?:\\.(\\d{1,5}))?/');
var CUSTOM_PLUGIN_RE = new RegExp('^/[\\w.-]*\\.whistle-path\\.5b6af7b9884e1165[\\w.-]*/+whistle\\.([a-z\\d_-]+)/');
var REAL_WEBUI_HOST_PARAM = /_whistleInternalHost_=(__([a-z\d.-]+)(?:__(\d{1,5}))?__)/;
var OUTER_PLUGIN_RE = /^(?:\/whistle)?\/((?:whistle|plugin)\.[a-z\\d_-]+)::(\d{1,5})\//;

module.exports = function(req, res, next) {
  var config = this.config;
  var pluginMgr = this.pluginMgr;
  var fullUrl = req.fullUrl = util.getFullUrl(req); // format request
  var host = util.parseHost(req.headers.host);
  var port = host[1] || (req.isHttps ? 443 : 80);
  var bypass;
  host = host[0];
  var transformPort, isProxyReq, isWeinre, isOthers;
  var webUI = WEBUI_PATH;
  var realHostRe = REAL_WEBUI_HOST;
  var internalAppRe = INTERNAL_APP;
  var pluginRe = PLUGIN_RE;
  var isWebUI = req.path.indexOf(WEBUI_PATH) === 0;
  var isOld;
  if (!isWebUI && CUSTOM_WEBUI_PATH_RE.test(req.path)) {
    isWebUI = true;
    isOld = true;
    webUI = CUSTOM_WEBUI_PATH;
    realHostRe = CUSTOM_REAL_WEBUI_HOST;
    internalAppRe = CUSTOM_INTERNAL_APP;
    pluginRe = CUSTOM_PLUGIN_RE;
  }
  if (isWebUI) {
    isWebUI = !config.pureProxy;
    var realHost;
    if (isWebUI) {
      if (realHostRe.test(req.path) || REAL_WEBUI_HOST_PARAM.test(req.url)) {
        var realPath = RegExp.$1;
        var realPort = RegExp.$3;
        realHost = RegExp.$2 + (realPort ? ':' + realPort : '');
        req.headers[config.REAL_HOST_HEADER] = realHost;
        req.url = req.url.replace(realPath, '');
      } else {
        req.curUrl = fullUrl;
        if (realHost = rules.resolveInternalHost(req)) {
          req.headers[config.REAL_HOST_HEADER] = realHost;
        }
      }
      if (internalAppRe.test(req.path)) {
        transformPort = RegExp.$2;
        isWeinre = RegExp.$1 === 'weinre';
        if (transformPort) {
          isOthers = isProxyReq = transformPort != config.port;
        } else {
          isProxyReq = false;
          transformPort = config.port;
        }
        isProxyReq = isProxyReq || isOld;
      } else if (pluginRe.test(req.path)) {
        isProxyReq = !pluginMgr.getPlugin(RegExp.$1 + ':');
      } else if (!req.headers[config.WEBUI_HEAD]) {
        isWebUI = false;
      }
      if (!config.proxyServer && isProxyReq && !config.isLocalUIUrl(host)) {
        isWebUI = false;
        req.isPluginReq = true;
        req._isProxyReq = true;
      }
    }
  } else {
    isWebUI = req.headers[config.WEBUI_HEAD];
    if (!isWebUI) {
      if (!(isWebUI = localIpCache.get(host))) {
        isWebUI = config.isLocalUIUrl(host);
        if (isWebUI ? net.isIP(host) : util.isLocalHost(host)) {
          isWebUI = util.isProxyPort(port);
        }
      }
    } else if (util.isProxyPort(port) && net.isIP(host)) {
      localIpCache.set(host, 1);
    }
    if (isWebUI) {
      if (req.path.indexOf('/_/') === 0) {
        bypass = '/_/';
      } else if (req.path.indexOf('/-/') === 0) {
        bypass = '/-/';
      }
      if (bypass) {
        req.url = req.url.replace(bypass, '/');
      }
      delete req.headers[config.INTERNAL_ID_HEADER];
    } else if (PREVIEW_PATH_RE.test(req.url)) {
      req.headers[config.INTERNAL_ID_HEADER] = config.INTERNAL_ID;
      req.url = '/preview.html?charset=' + RegExp.$1;
      isWebUI = true;
    }
  }
  // 后续有用到
  fullUrl = req.fullUrl = util.getFullUrl(req);
  if (bypass) {
    return next();
  }
  var localRule;
  req.curUrl = fullUrl;
  if (isWebUI) {
    if (isOthers) {
      util.transformReq(req, res, transformPort);
    } else {
      req.url = req.url.replace(transformPort ? internalAppRe : webUI, '/');
      if (OUTER_PLUGIN_RE.test(req.path)) {
        var outerPort = RegExp.$2;
        req.url = req.url.replace(RegExp['$&'], '/' + RegExp.$1 + '/');
        if (outerPort > 0 && outerPort < 65536 && outerPort != config.port) {
          req.headers.host = '127.0.0.1:' + outerPort;
          return util.transformReq(req, res, outerPort);
        }
      }
      req._hasRespond = true;
      if (isWeinre) {
        handleWeinreReq(req, res);
      } else {
        handleUIReq(req, res);
      }
    }
  } else if (localRule = rules.resolveLocalRule(req)) {
    req.url = localRule.url;
    if (localRule.realPort) {
      req.headers.host = '127.0.0.1:' + localRule.realPort;
      util.transformReq(req, res, localRule.realPort);
    } else {
      handleUIReq(req, res);
    }
  } else {
    next();
  }
};

