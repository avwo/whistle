var properties = require('../../../../lib/rules/util').properties;
var pluginMgr = require('../../lib/proxy').pluginMgr;
var sortPlugins = require('../util').sortPlugins;

module.exports = function(req, res) {
  var plugins = pluginMgr.getPlugins();
  var disabledPlugins = properties.get('disabledPlugins') || {};
  res.json({
    disabled: !!properties.get('disabledAllPlugins'),
    list: sortPlugins(plugins).map(function(plugin) {
      name = plugin.moduleName;
      name = name.substring(name.lastIndexOf('.') + 1);
      return {
        name: name,
        moduleName: plugin.moduleName,
        version: plugin.version,
        selected: !disabledPlugins[name]
      };
    })
  });
};
