var url = require('url');
var util = require('../util');
var pluginMgr = require('../plugins');

module.exports = function(req, res, next) {
  var protocol = req.options && req.options.protocol;
  var plugin = pluginMgr.getPlugin(protocol);
  if (!plugin) {
    return next();
  }

  pluginMgr.loadPlugin(plugin, function(err, ports) {
    if (err || !ports.port) {
      res.response(util.wrapGatewayError(err || new Error('No plugin.server')));
      return;
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
