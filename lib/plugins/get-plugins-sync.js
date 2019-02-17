var path = require('path');
var fs = require('fs');
var fse = require('fs-extra2');
var protocols = require('../rules/protocols');
var util = require('../util');
var pluginUtil = require('./util');
var mp = require('./module-paths');
var paths = mp.getPaths();

function readPluginMoudlesSync(dir, plugins) {
  plugins = plugins || {};
  try {
    var list = fs.readdirSync(dir).filter(function(name) {
      if (pluginUtil.isWhistleModule(name)) {
        return true;
      }

      if (pluginUtil.isOrgModule(name)) {
        try {
          var _dir = path.join(dir, name);
          fs.readdirSync(_dir).forEach(function(name) {
            if (!plugins[name] && pluginUtil.isWhistleModule(name)) {
              plugins[name] = path.join(_dir, name);
            }
          });
        } catch(e) {}
      }
      return false;
    });

    list.forEach(function(name) {
      if (!plugins[name]) {
        plugins[name] = path.join(dir, name);
      }
    });
  } catch(e) {}

  return plugins;
}

module.exports = function() {
  var plugins = {};
  paths.forEach(function(dir) {
    readPluginMoudlesSync(dir, plugins);
  });

  var _plugins = {};
  Object.keys(plugins).forEach(function(name) {
    var simpleName = name.split('.')[1];
    if (protocols.contains(simpleName)) {
      return;
    }
    var dir = plugins[name];
    try {
      var pkgPath = path.join(dir, 'package.json');
      var pkg = fse.readJsonSync(pkgPath);
      if (pkg && pkg.version) {
        var stats = fs.statSync(pkgPath);
        var plugin = {
          moduleName: pkg.name,
          pluginHomepage: pluginUtil.getPluginHomepage(pkg),
          priority: parseInt(pkg.pluginPriority, 10) || 0,
          registry: util.getRegistry(pkg),
          path: dir,
          pkgPath: pkgPath,
          mtime: stats.mtime.getTime(),
          version: pkg.version,
          description: pkg.description,
          homepage: pluginUtil.getHomePageFromPackage(pkg),
          rules: util.trim(util.readFileSync(path.join(dir, 'rules.txt'))),
          _rules: util.trim(util.readFileSync(path.join(dir, '_rules.txt')))
            || util.trim(util.readFileSync(path.join(dir, 'reqRules.txt'))),
          resRules: util.trim(util.readFileSync(path.join(dir, 'resRules.txt'))),
          _values: pluginUtil.parseValues(util.readFileSync(path.join(dir, '_values.txt')))
        };

        _plugins[simpleName + ':'] = plugin;
      }
    } catch(e) {}
  });

  return _plugins;
};


