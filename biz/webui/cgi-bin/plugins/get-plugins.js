var properties = require('../../../../lib/rules/util').properties;
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  res.json({
    ec: 0,
    plugins: pluginMgr.getPlugins(),
    disabledPlugins: properties.get('disabledPlugins') || {},
    disabledAllPlugins: properties.get('disabledAllPlugins')
  });
};
