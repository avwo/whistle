var config = require('../../../../lib/config');
var common = require('../../../../lib/util/common');

module.exports = function(req, res) {
  if (!config.installPlugins) {
    return res.status(404).end();
  }
  var data = common.getPluginsData(req.body);
  data && config.installPlugins(data);
  res.json({ ec: 0, count: data ? data.pkgs.length : 0 });
};