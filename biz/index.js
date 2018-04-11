var net = require('net');
var rules = require('../lib/rules');
var util = require('../lib/util');

var HTTP_PROXY_RE = /^(?:proxy|http-proxy|http2https-proxy|https2http-proxy|internal-proxy):\/\//;
var INTERNAL_APP = /^\/(log|weinre)\.(\d{1,5})\//;
var PLUGIN_RE = /^\/whistle\.([a-z\d_\-]+)\//;
var PROXY_PATH = '/.proxy/';

module.exports = function(req, res, next) {
  var config = this.config;
  var pluginMgr = this.pluginMgr;
  var WEBUI_PATH = config.WEBUI_PATH;
  var host = (req.headers.host || '').split(':');
  var port = host[1] || 80;
  var bypass;
  host = host[0];
  var transformPort, proxyUrl;
  var isWebUI = req.path.indexOf(WEBUI_PATH) === 0;
  if (isWebUI) {
    isWebUI = !config.pureProxy;
    if (isWebUI) {
      req.url = req.url.replace(WEBUI_PATH, '/');
      proxyUrl =req.path.indexOf(PROXY_PATH) === 0;
      if (proxyUrl) {
        req.url = req.url.replace(PROXY_PATH, '/');
      }
      if (INTERNAL_APP.test(req.path)) {
        transformPort = RegExp.$2;
        proxyUrl = transformPort === (RegExp.$1 === 'weinre' ? config.weinreport : config.uiport);
        if (!proxyUrl) {
          req.url = req.url.replace(RegExp['$&'], '/');
        }
      } else if (PLUGIN_RE.test(req.path)) {
        proxyUrl = !pluginMgr.getPlugin(RegExp.$1 + ':');
      }
      if (proxyUrl) {
        proxyUrl = rules.resolveProxy(util.getFullUrl(req));
        proxyUrl = proxyUrl && proxyUrl.matcher;
        if (proxyUrl && HTTP_PROXY_RE.test(proxyUrl)) {
          proxyUrl = proxyUrl.replace(HTTP_PROXY_RE, '');
        } else {
          proxyUrl = null;
        }
      }
    }
  } else {
    isWebUI = req.headers[config.WEBUI_HEAD] || config.isLocalUIUrl(host);
    if (isWebUI || (net.isIP(host) && util.isLocalAddress(host))) {
      if (req.path.indexOf('/_/') === 0) {
        bypass = '/_/';
      } else if (req.path.indexOf('/-/') === 0) {
        bypass = '/-/';
      }
      if (bypass) {
        req.url = req.url.replace(bypass, '/');
      } else if (!isWebUI) {
        if (port == config.port || port == config.uiport) {
          host = config.localUIHost;
          isWebUI = true;
        } else if (port == config.weinreport) {
          host = config.WEINRE_HOST;
        }
      }
    }
  }
  // 后续有用到
  var fullUrl = req.fullUrl = util.getFullUrl(req);
  if (bypass) {
    return next();
  }
  var pluginHomePage, options, localRule;
  if (!isWebUI && (options = config.parseInternalUrl(host))) {
    isWebUI = true;
    transformPort = options.port;
  }
  if (isWebUI) {
    if (proxyUrl) {
      rules.resolveHost('http://' + proxyUrl, function(err, ip) {
        if (err) {
          return next(err);
        }
        req.url = WEBUI_PATH + req.url.substring(1);
        var colon = proxyUrl.indexOf(':');
        var proxyPort = colon === -1 ? 80 : proxyUrl.substring(colon + 1);
        util.transformReq(req, res, proxyPort > 0 ? proxyPort : 80, ip);
      });
    } else {
      util.transformReq(req, res, transformPort || config.uiport);
    }
  } else if (pluginHomePage || (pluginHomePage = pluginMgr.getPluginByHomePage(fullUrl))) {
    pluginMgr.loadPlugin(pluginHomePage, function(err, ports) {
      if (err || !ports.uiPort) {
        res.response(util.wrapResponse({
          statusCode: err ? 500 : 404,
          headers: {
            'content-type': 'text/html; charset=utf-8'
          },
          body: '<pre>' + (err || 'Not Found') + '</pre>'
        }));
        return;
      }
      util.transformReq(req, res, ports.uiPort);
    });
  } else if (localRule = rules.resolveLocalRule(fullUrl)) {
    req.url = localRule.url;
    util.transformReq(req, res, config.uiport);
  } else {
    next();
  }
};

