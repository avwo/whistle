var pluginMgr = require('../../lib/proxy').pluginMgr;
var sortPlugins = require('../util').sortPlugins;

module.exports = function(req, res) {
  res.json(sortPlugins(pluginMgr.getPlugins()));
};
