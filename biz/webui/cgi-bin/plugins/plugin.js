var pluginMgr = require('../../lib/proxy').pluginMgr;
var properties = require('../../../../lib/rules/util').properties;
var extend = require('extend');

module.exports = function(req, res) {
  var name = req.query.name;
  var plugin = pluginMgr.getPluginByName(name);
  if (plugin) {
    var disabledPlugins = properties.get('disabledPlugins');
    if (disabledPlugins) {
      plugin = extend({}, plugin);
      plugin.selected = !disabledPlugins[name];
    }
  }
  res.json({ ec: 0, plugin: plugin || undefined });
};
