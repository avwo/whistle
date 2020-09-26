var path = require('path');
var fs = require('fs');
var util = require('./util');
var mp = require('./module-paths');
var config = require('../config');

var systemPluginPath = config.systemPluginPath;
var CUSTOM_PLUGIN_PATH = config.CUSTOM_PLUGIN_PATH;
var customPluginPaths = config.customPluginPaths || [];
var projectPluginPaths = config.projectPluginPaths || [];

function readPluginMoudles(dir, callback, plugins, isCustom) {
  fs.readdir(dir, function(err, list) {
    plugins = plugins || {};
    if (err) {
      return callback(plugins);
    }

    var count = 0;
    var callbackHandler = function() {
      list.forEach(function(name) {
        if (!plugins[name]) {
          plugins[name] = isCustom ? path.join(dir, name, 'node_modules', name) : path.join(dir, name);
        }
      });
      callback(plugins);
    };
    list = list.filter(function(name) {
      if (util.isWhistleModule(name)) {
        return true;
      }

      if (util.isOrgModule(name)) {
        try {
          var _dir = path.join(dir, name);
          ++count;
          var org = name;
          fs.readdir(_dir, function(err, list) {
            if (!err) {
              list.forEach(function(name) {
                if (!plugins[name] && util.isWhistleModule(name)) {
                  plugins[name] = isCustom ? path.join(_dir, name, 'node_modules', org, name) : path.join(_dir, name);
                }
              });
            }

            if (--count <= 0) {
              callbackHandler();
            }
          });
        } catch(e) {}
      }

      return false;
    });

    if (!count) {
      callbackHandler();
    }
  });
}

module.exports = function(callback) {
  var plugins = {};
  var result = {};
  var paths = mp.getPaths();
  var count = paths.length;
  if (!count) {
    return callback(result);
  }

  var loadPlugins = function(dir, cb) {
    var isCustom = CUSTOM_PLUGIN_PATH === dir;
    var isSys = isCustom || systemPluginPath === dir || customPluginPaths.indexOf(dir) !== -1;
    var isProj = projectPluginPaths.indexOf(dir) !== -1;
    readPluginMoudles(dir, function() {
      var list = Object.keys(plugins).filter(function(name) {
        return !util.excludePlugin(name.split('.')[1]);
      });
      var len = list.length;
      list.forEach(function(name) {
        var dir = plugins[name];
        var pkgPath = path.join(dir, 'package.json');
        fs.stat(pkgPath, function(err, stats) {
          if (stats && stats.mtime) {
            name = name.split('.')[1] + ':';
            result[name] = result[name] || {
              isSys: isSys,
              isProj: isProj,
              path: dir,
              pkgPath: pkgPath,
              mtime: stats.mtime.getTime()
            };
          }
          if (--len <= 0) {
            cb();
          }
        });
      });

      if (!len) {
        cb();
      }
    }, plugins, isCustom);
  };
  var index = 0;
  var callbackHandler = function() {
    var dir = paths[++index];
    if (dir) {
      return loadPlugins(dir, callbackHandler);
    }
    callback(result);
  };
  loadPlugins(paths[index], callbackHandler);
};


