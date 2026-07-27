var pluginMgr = require('../../lib/proxy').pluginMgr;
var sortPlugins = require('../util').sortPlugins;
var properties = require('../../../../lib/rules/util').properties;
var extend = require('extend');

module.exports = function(req, res) {
  var disabledPlugins = properties.get('disabledPlugins');
  var list = sortPlugins(pluginMgr.getPlugins()).map(function(plugin) {
    var name = plugin.moduleName;
    name = name.substring(name.lastIndexOf('.') + 1);
    plugin = extend({}, plugin);
    plugin.name = name;
    plugin.selected = !disabledPlugins[name];
    return plugin;
  });
  res.json(list);
};
