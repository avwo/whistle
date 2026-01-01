var util = require('../util');
var pluginMgr = require('../plugins');
var protoMgr = require('../rules/protocols');

var handleReq = function (req, next) {
  if (req.isWebProtocol) {
    req.request(req.options);
  } else {
    next(new Error('Unsupported protocol ' + req.options.protocol));
  }
};

module.exports = function (req, res, next) {
  var protocol = req.options && req.options.protocol;
  req.isWebProtocol = protoMgr.isWebProtocol(protocol);
  var plugin = !req.isWebProtocol && pluginMgr.getPlugin(protocol);
  if (!plugin) {
    return handleReq(req, next);
  }

  pluginMgr.loadPlugin(req.isPluginReq && !req._isPureInternalReq ? null : plugin, function (err, ports) {
    if (err) {
      res.response(util.wrapGatewayError(err));
      return;
    }

    if (!ports.port) {
      req.isWebProtocol = true;
      req.options = util.parseUrl(req.fullUrl);
      return handleReq(req, next);
    }
    req.customParser = util.getParserStatus(req);
    if (req.customParser) {
      req.initCustomParser();
    }
    var fullUrl = req.options._realUrl || req.fullUrl;
    var options = util.parseUrl(fullUrl);
    pluginMgr.addRuleHeaders(req, req.rules);
    options.protocol = 'http:';
    options.host = '127.0.0.1';
    options.port = ports.port;
    options.href = util.changePort(fullUrl, ports.port);
    options.localDNS = true;
    options.isPlugin = true;
    req.request(options);
  });
};
