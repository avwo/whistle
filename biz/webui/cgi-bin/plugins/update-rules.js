var config = require('../../../../lib/config');
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  var name = req.headers[config.PROXY_ID_HEADER];
  pluginMgr.updatePluginRules(name);
  res.json({ec: 0});
};
