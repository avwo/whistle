var path = require('path');
var fs = require('fs');
var pluginMgr = require('../../lib/proxy').pluginMgr;

module.exports = function(req, res) {
  var plugin = pluginMgr.getModifiablePlugin(req.body.name);
  if (!plugin) {
    return res.json({ ec: 0 });
  }
  var pkgPath = path.join(plugin.path, 'package.json');
  var newPkgPath = pkgPath + '.' + Date.now();
  var retry;
  var handleCb = function(err) {
    if (err && err.code !== 'ENOENT') {
      if (!retry) {
        retry = true;
        return fs.unlink(pkgPath, handleCb);
      }
      return res.json({ ec: 2, em: err.message || 'Error' });
    }
    pluginMgr.refreshPlugins();
    res.json({ ec: 0 });
  };
  fs.rename(pkgPath, newPkgPath, handleCb);
};
