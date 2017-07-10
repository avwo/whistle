var net = require('net');
var util = require('../lib/util');

module.exports = function(req, res, next) {
  var config = this.config;
  var host = (req.headers.host || '').split(':');
  var port = host[1] || 80;
  host = host[0];
  if (net.isIP(host) && util.isLocalAddress(host)) {
    if (port == config.port || port == config.uiport) {
      host = config.localUIHost;
    } else if (port == config.weinreport) {
      host = config.WEINRE_HOST;
    }
  }

  var pluginMgr = this.pluginMgr;
  var fullUrl = req.fullUrl = util.getFullUrl(req);
  var isWebUI = req.headers[config.WEBUI_HEAD] || config.isLocalUIUrl(host);
  var weinrePort, pluginHomePage, logPort, options;
  if (!isWebUI && (options = config.parseInternalUrl(host))) {
    if (options.name === 'weinre') {
      weinrePort = options.port;
    } else if (/[^?]*\/cgi-bin\/log\/set$/.test(req.path) && options.name === 'log') {
      logPort = options.port;
    }
  }
  if (isWebUI || logPort) {
    util.transformReq(req, res, logPort || config.uiport);
  } else if (weinrePort) {
    util.transformReq(req, res, weinrePort, true);
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
  } else {
    next();
  }
};

