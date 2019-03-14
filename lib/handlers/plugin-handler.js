var url = require('url');
var util = require('../util');
var pluginMgr = require('../plugins');
var protoMgr = require('../rules/protocols');

module.exports = function(req, res, next) {
  var protocol = req.options && req.options.protocol;
  req.isWebProtocol = protoMgr.isWebProtocol(protocol);
  var plugin = !req.isWebProtocol && pluginMgr.getPlugin(protocol);
  if (!plugin) {
    return next();
  }

  pluginMgr.loadPlugin(plugin, function(err, ports) {
    if (err) {
      res.response(util.wrapGatewayError(err));
      return;
    }

    if (!ports.port) {
      req.isWebProtocol = true;
      req.options = url.parse(req.fullUrl);
      return next();
    }

    var options = url.parse(req.fullUrl);
    pluginMgr.addRuleHeaders(req, req.rules);
    options.protocol = 'http:';
    options.host = '127.0.0.1';
    options.port = ports.port;
    options.href = util.changePort(req.fullUrl, ports.port);
    options.localDNS = true;
    options.isPlugin = true;
    req.request(options);
  });
};
