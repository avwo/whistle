var net = require('net');
var rules = require('../lib/rules');
var util = require('../lib/util');
var handleUIReq = require('./webui/lib').handleRequest;
var handleWeinreReq = require('./weinre');

var HTTP_PROXY_RE = /^x?(?:proxy|http-proxy|http2https-proxy|https2http-proxy|internal-proxy):\/\//;
var INTERNAL_APP, WEBUI_PATH, PLUGIN_RE, PREVIEW_PATH_RE;

module.exports = function(req, res, next) {
  var config = this.config;
  var pluginMgr = this.pluginMgr;
  if (!INTERNAL_APP) {
    WEBUI_PATH = config.WEBUI_PATH;
    PREVIEW_PATH_RE = config.PREVIEW_PATH_RE;
    var webuiPathRe = util.escapeRegExp(WEBUI_PATH);
    INTERNAL_APP = new RegExp('^' + webuiPathRe + '(log|weinre|cgi)(?:\\.(\\d{1,5}))?/');
    PLUGIN_RE = new RegExp('^' + webuiPathRe + 'whistle\\.([a-z\\d_-]+)/');
  }
  var fullUrl = util.getFullUrl(req);
  var host = req.headers.host.split(':');
  var port = host[1] || (req.isHttps ? 443 : 80);
  var bypass;
  host = host[0];
  var transformPort, proxyUrl, isWeinre, isOthers;
  var isWebUI = req.path.indexOf(WEBUI_PATH) === 0;
  if (isWebUI) {
    isWebUI = !config.pureProxy;
    if (isWebUI) {
      if (INTERNAL_APP.test(req.path)) {
        transformPort = RegExp.$2;
        isWeinre = RegExp.$1 === 'weinre';
        if (transformPort) {
          isOthers = proxyUrl = transformPort != config.port;
        } else {
          proxyUrl = false;
          transformPort = config.port;
        }
      } else if (PLUGIN_RE.test(req.path)) {
        proxyUrl = !pluginMgr.getPlugin(RegExp.$1 + ':');
      } else if (!req.headers[config.WEBUI_HEAD]) {
        isWebUI = false;
      }
      if (proxyUrl) {
        req.curUrl = fullUrl;
        proxyUrl = rules.resolveProxy(req);
        proxyUrl = proxyUrl && proxyUrl.matcher;
        if (proxyUrl && HTTP_PROXY_RE.test(proxyUrl)) {
          proxyUrl = proxyUrl.replace(HTTP_PROXY_RE, '');
        } else {
          proxyUrl = null;
        }
      }
    }
  } else {
    isWebUI = req.headers[config.WEBUI_HEAD];
    if (!isWebUI) {
      isWebUI = config.isLocalUIUrl(host);
      if (isWebUI ? net.isIP(host) : util.isLocalAddress(host)) {
        isWebUI = port == config.port || port == config.uiport;
      }
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
    } else if (PREVIEW_PATH_RE.test(req.url)) {
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
  if (proxyUrl) {
    req.curUrl = 'http://' + proxyUrl;
    rules.resolveHost(req, function(err, ip) {
      if (err) {
        return next(err);
      }
      var colon = proxyUrl.indexOf(':');
      var proxyPort = colon === -1 ? 80 : proxyUrl.substring(colon + 1);
      req.headers.host = 'local.whistlejs.com';
      util.setClientId(req.headers, rules.resolveEnable(req), rules.resolveDisable(req), req.clientIp);
      util.transformReq(req, res, proxyPort > 0 ? proxyPort : 80, ip);
    });
  } else if (isWebUI) {
    if (isOthers) {
      util.transformReq(req, res, transformPort);
    } else {
      req.url = req.url.replace(transformPort ? INTERNAL_APP : WEBUI_PATH, '/');
      if (isWeinre) {
        handleWeinreReq(req, res);
      } else {
        handleUIReq(req, res);
      }
    }
  } else if (localRule = rules.resolveLocalRule(req)) {
    req.url = localRule.url;
    handleUIReq(req, res);
  } else {
    next();
  }
};

