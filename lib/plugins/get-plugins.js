var path = require('path');
var util = require('./util');
var mp = require('./module-paths');
var config = require('../config');

var CUSTOM_PLUGIN_PATH = config.CUSTOM_PLUGIN_PATH;
var customPluginPaths = config.customPluginPaths || [];
var notUninstallPluginPaths = config.notUninstallPluginPaths || [];
var projectPluginPaths = config.projectPluginPaths || [];
var accountPluginsPath = config.accountPluginsPath || [];

function readPluginRootList(dir, callback) {
  var roots = [];
  util.readDir(dir, function (_, list) {
    if (!list || !list.length) {
      return callback(roots);
    }
    var handleCallback = function () {
      var orgRoots = [];
      roots = roots.filter(function (obj) {
        if (!Array.isArray(obj)) {
          return obj;
        }
        orgRoots.push.apply(orgRoots, obj);
      });
      callback(orgRoots.concat(roots));
    };
    var count = 0;
    list.forEach(function (name, i) {
      if (util.isWhistleModule(name)) {
        roots[i] = {
          name: name,
          dir: dir
        };
      } else if (util.isOrgModule(name)) {
        ++count;
        util.readDir(path.join(dir, name), function (_, list2) {
          if (list2 && list2.length) {
            var orgList;
            list2.forEach(function (pluginName) {
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

function readPluginModules(dir, callback, plugins, isCustom) {
  readPluginRootList(dir, function (list) {
    var len = list.length;
    if (!len) {
      return callback(plugins);
    }
    list.forEach(function (obj) {
      var dir = obj.dir;
      var dirName = obj.org ? obj.org + '/' + obj.name : obj.name;
      var root = isCustom
        ? path.join(dir, dirName, 'node_modules', dirName)
        : path.join(dir, dirName);
      util.statFile(path.join(root, 'package.json'), function (stats) {
        if (stats) {
          obj.root = root;
          obj.mtime = stats.mtime.getTime();
        }
        if (--len === 0) {
          list.forEach(function (obj) {
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

module.exports = function (callback) {
  util.readDevPlugins(function(plugins) {
    var result = {};
    var paths = mp.getPaths();
    var count = paths.length;
    if (!count && !Object.keys(plugins).length) {
      return callback(result);
    }

    var loadPlugins = function (dir, cb) {
      var isAccount = accountPluginsPath.indexOf(dir) !== -1;
      var account = isAccount ? config.account : undefined;
      var isSys = isAccount || CUSTOM_PLUGIN_PATH === dir || customPluginPaths.indexOf(dir) !== -1;
      var isProj = projectPluginPaths.indexOf(dir) !== -1;
      var notUn = notUninstallPluginPaths.indexOf(dir) !== -1;
      readPluginModules(
      dir,
      function () {
        Object.keys(plugins).filter(function (name) {
          if (util.excludePlugin(name) || result[name + ':']) {
            return;
          }
          var obj = plugins[name];
          result[name + ':'] = {
            account: account,
            isSys: isSys,
            isProj: isProj || obj.isProj,
            notUn: notUn,
            isDev: obj.isDev,
            path: obj.root,
            mtime: obj.mtime
          };
        });
        cb();
      },
      plugins,
      isSys
    );
    };
    var index = 0;
    var callbackHandler = function () {
      var dir = paths[++index];
      if (dir) {
        return loadPlugins(dir, callbackHandler);
      }
      callback(result);
    };
    loadPlugins(paths[index], callbackHandler);
  });
};
