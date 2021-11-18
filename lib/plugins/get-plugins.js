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
  fs.stat(filepath, function(_, stat1) {
    if (stat1) {
      return callback(stat1.isFile() && stat1);
    }
    fs.stat(filepath, function(_, stat2) {
      callback(stat2 && stat2.isFile() && stat2);
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
            count = -1;
            handleCallback(roots);
          }
        });
      }
    });
    if (count === 0) {
      count = -1;
      handleCallback(roots);
    }
  });
}


function readPluginMoudles(dir, callback, plugins, isCustom) {
  readPluginRootList(dir, function(list) {
    var len = list.length;
    if (!len) {
      return callback(plugins);
    }
    list.forEach(function(obj) {
      var dir = obj.dir;
      var dirName = obj.org ? obj.org + '/' + obj.name : obj.name;
      var root = isCustom ? path.join(dir, dirName, 'node_modules', dirName) : path.join(dir, dirName);
      statFile(path.join(root, 'package.json'), function(stats) {
        if (stats) {
          obj.root = root;
          obj.mtime = stats.mtime.getTime();
        }
        if (--len === 0) {
          list.forEach(function(obj) {
            var name = obj.name.split('.')[1];
            if (obj.root && !plugins[name]) {
              plugins[name] = obj;
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
      Object.keys(plugins).filter(function(name) {
        if (util.excludePlugin(name) || result[name + ':']) {
          return;
        }
        var obj = plugins[name];
        result[name + ':'] = {
          isSys: isSys,
          isProj: isProj,
          path: obj.root,
          mtime: obj.mtime
        };
      });
      cb();
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


