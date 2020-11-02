var net = require('net');
var rules = require('../lib/rules');
var util = require('../lib/util');
var handleUIReq = require('./webui/lib').handleRequest;
var handleWeinreReq = require('./weinre');
var config = require('../lib/config');

var localIpCache = util.localIpCache;
var WEBUI_PATH = config.WEBUI_PATH;
var PREVIEW_PATH_RE = config.PREVIEW_PATH_RE;
var webuiPathRe = util.escapeRegExp(WEBUI_PATH);
var INTERNAL_APP = new RegExp('^' + webuiPathRe + '(log|weinre|cgi)(?:\\.(\\d{1,5}))?/');
var PLUGIN_RE = new RegExp('^' + webuiPathRe + 'whistle\\.([a-z\\d_-]+)/');

module.exports = function(req, res, next) {
  var config = this.config;
  var pluginMgr = this.pluginMgr;
  var fullUrl = util.getFullUrl(req);
  var host = util.parseHost(req.headers.host);
  var port = host[1] || (req.isHttps ? 443 : 80);
  var bypass;
  host = host[0];
  var transformPort, proxyUrl, isWeinre, isOthers, isInternal;
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
        rules.getHttpProxy(fullUrl, req, function() {
          proxyUrl = req.rules.proxy;
          if (proxyUrl) {
            isInternal = proxyUrl.isInternal;
            proxyUrl = proxyUrl.matcher;
          }
          if (proxyUrl) {
            proxyUrl = proxyUrl.substring(proxyUrl.indexOf('://') + 3);
          } else {
            proxyUrl = null;
          }
          handleNext();
        });
        return;
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
  handleNext();
  
  function handleNext() {
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
        util.setClientId(req.headers, req.enable, req.disable, req.clientIp, isInternal);
        util.transformReq(req, res, proxyPort > 0 ? proxyPort : 80, ip, true);
      });
    } else if (isWebUI) {
      if (isOthers) {
        util.transformReq(req, res, transformPort);
      } else {
        req._hasRespond = true;
        req.url = req.url.replace(transformPort ? INTERNAL_APP : WEBUI_PATH, '/');
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
  }
};

