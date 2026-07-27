var properties = require('../../../../lib/rules/util').properties;
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  var name = req.body.name;
  var disabledPlugins = properties.get('disabledPlugins') || {};
  var exists = false;
  if (typeof name === 'string') {
    name = name.trim();
    name = name.substring(name.lastIndexOf('.') + 1);
    exists = !!pluginMgr.getPluginByName(name);
    if (exists) {
      if (req.body.disabled == 1) {
        disabledPlugins[name] = 1;
      } else {
        delete disabledPlugins[name];
      }
      properties.set('disabledPlugins', disabledPlugins);
      pluginMgr.updateRules();
    }
  }
  res.json({ec: 0, data: disabledPlugins, exists: exists});
};
