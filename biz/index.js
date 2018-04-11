var net = require('net');
var rules = require('../lib/rules');
var util = require('../lib/util');

var INTERNAL_APP = /^\/(log|weinre)\.(\d{1,5})\//;

module.exports = function(req, res, next) {
  var config = this.config;
  var WEBUI_PATH = config.WEBUI_PATH;
  var host = (req.headers.host || '').split(':');
  var port = host[1] || 80;
  var bypass;
  host = host[0];
  var transformPort;
  var isWebUI = req.path.indexOf(WEBUI_PATH) === 0;
  if (isWebUI) {
    isWebUI = !config.pureProxy;
    if (isWebUI) {
      req.url = req.url.replace(WEBUI_PATH, '/');
      if (INTERNAL_APP.test(req.path)) {
        req.url = req.url.replace(RegExp['$&'], '/');
        transformPort = RegExp.$2;
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
  var pluginMgr = this.pluginMgr;
  var pluginHomePage, options, localRule;
  if (!isWebUI && (options = config.parseInternalUrl(host))) {
    isWebUI = true;
    transformPort = options.port;
  }
  if (isWebUI) {
    util.transformReq(req, res, transformPort || config.uiport);
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

