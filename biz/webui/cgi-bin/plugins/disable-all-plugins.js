var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  pluginMgr.disableAllPlugins(req.body.disabledAllPlugins == 1);
  res.json({ec: 0, em: 'success'});
};
