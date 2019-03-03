var properties = require('../../../../lib/rules/util').properties;
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  var disabledPlugins = properties.get('disabledPlugins') || {};
  if (req.body.disabled == 1) {
    disabledPlugins[req.body.name] = 1;
  } else {
    delete disabledPlugins[req.body.name];
  }
  properties.set('disabledPlugins', disabledPlugins);
  pluginMgr.updateRules();
  res.json({ec: 0, data: disabledPlugins});
};
