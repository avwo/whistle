var pluginMgr = require('../../lib/proxy').pluginMgr;
var config = require('../../../../lib/config');

module.exports = function(req, res) {
  var name = req.headers[config.PROXY_ID_HEADER];
  res.json({
    ec: 0,
    enable: !!name && !!pluginMgr.getPlugin(name + ':')
  });
};
