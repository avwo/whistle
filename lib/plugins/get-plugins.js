var path = require('path');
var fs = require('fs');
var util = require('./util');
var mp = require('./module-paths');
var config = require('../config');

var systemPluginPath = config.systemPluginPath;
var CUSTOM_PLUGIN_PATH = config.CUSTOM_PLUGIN_PATH;
var customPluginPaths = config.customPluginPaths || [];
var projectPluginPaths = config.projectPluginPaths || [];


function readDir(dir, callback) {
  fs.readdir(dir, function(err, list) {
    if (!err) {
      return callback(err, list);
    }
    fs.readdir(dir, callback);
  });
}

function statFile(filepath, callback) {
  fs.stat(filepath, function(_, stat) {
    if (stat) {
      return callback(stat.isFile());
    }
    fs.stat(filepath, function(err, stat) {
      callback(stat && stat.isFile());
    });
  });
}

function readPluginRootList(dir, callback) {
  var roots = [];
  readDir(dir, function(_, list) {
    if (!list || !list.length) {
      return callback(roots);
    }
    var handleCallback = function() {
      var orgRoots = [];
      roots = roots.filter(function(obj) {
        if (!Array.isArray(obj)) {
          return obj;
        }
        orgRoots.push.apply(orgRoots, obj);
      });
      callback(orgRoots.concat(roots));
    };
    var count = 0;
    list.forEach(function(name, i) {
      if (util.isWhistleModule(name)) {
        roots[i] = {
          name: name,
          dir: dir
        };
      } else if (util.isOrgModule(name)) {
        ++count;
        readDir(path.join(dir, name), function(_, list2) {
          if (list2 && list2.length) {
            var orgList;
            list2.forEach(function(pluginName) {
              if (util.isWhistleModule(pluginName)) {
                orgList = orgList || [];
                orgList.push({
                  org: name,
                  name: pluginName,
                  dir: dir
                });
              }
            });
            roots[i] = orgList;
          }
          if (--count === 0) {
            handleCallback(roots);
          }
        });
      }
    });
    !count && handleCallback(roots);
  });
}


function readPluginMoudles(dir, callback, plugins, isCustom) {
  readPluginRootList(dir, function(list) {
    plugins = plugins || {};
    var len = list.length;
    if (!len) {
      return callback(plugins);
    }
    list.forEach(function(obj) {
      var dir = obj.dir;
      var name = obj.name;
      if (obj.org) {
        name = obj.org + '/' + name;
      }
      var root = isCustom ? path.join(dir, name, 'node_modules', name) : path.join(dir, name);
      statFile(path.join(root, 'package.json'), function(isFile) {
        if (isFile) {
          obj.root = root;
        }
        if (--len === 0) {
          list.forEach(function(obj) {
            if (obj.root && !plugins[obj.name]) {
              plugins[obj.name] = obj.root;
            }
          });
          callback(plugins);
        }
      });
    });
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
      if (!len) {
        return cb();
      }
      list.forEach(function(name, i) {
        var dir = plugins[name];
        var pkgPath = path.join(dir, 'package.json');
        fs.stat(pkgPath, function(err, stats) {
          if (stats && stats.mtime) {
            name = name.split('.')[1] + ':';
            list[i] = {
              name: name,
              isSys: isSys,
              isProj: isProj,
              path: dir,
              pkgPath: pkgPath,
              mtime: stats.mtime.getTime()
            };
          }
          if (--len === 0) {
            list.forEach(function(item) {
              if (item && !result[item.name]) {
                result[item.name] = item;
              }
            });
            cb();
          }
        });
      });
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


