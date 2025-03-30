var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  pluginMgr.addRegistry(req.body.registry);
  res.json({ec: 0});
};
