var properties = require('../../../../lib/rules/util').properties;
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  properties.set('disabledAllPlugins', req.body.disabledAllPlugins == 1);
  pluginMgr.updateRules();
  res.json({ec: 0, em: 'success'});
};
