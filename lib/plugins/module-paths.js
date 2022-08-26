var path = require('path');
var config = require('../config');

var uniqueArr = function(list) {
  var result = [];
  list.forEach(function(item) {
    if (result.indexOf(item) === -1) {
      result.push(item);
    }
  });
  return result;
};
var resolvePath = function (str) {
  return path.resolve(str);
};
var prePlugins = (config.prePluginsPath || []).map(resolvePath);
var addon = (config.addon || []).map(resolvePath);
addon = addon.concat(addon.map(formatPath));

function addDebugPaths(plugins) {
  if (config.debugMode) {
    var cwd = process.cwd();
    plugins.unshift(cwd);
    config.projectPluginPaths = config.projectPluginPaths || [];
    config.projectPluginPaths.push(cwd);
    var pluginDirRe = /[/\\]whistle\.[a-z\d_-]+[/\\]?$/;
    if (pluginDirRe.test(cwd)) {
      plugins.unshift(cwd.replace(pluginDirRe, '/'));
    }
  }
}

var pluginPaths = config.pluginPaths;
if (pluginPaths) {
  pluginPaths = prePlugins.concat(pluginPaths.concat(
    pluginPaths.map(formatPath).concat(addon)
  ));
  addDebugPaths(pluginPaths);
  pluginPaths = uniqueArr(pluginPaths);
  exports.getPaths = function () {
    return pluginPaths;
  };
  return;
}

addon = prePlugins.concat(addon);
if (config.noGlobalPlugins) {
  addDebugPaths(addon);
  addon = uniqueArr(addon);
  exports.getPaths = function () {
    return addon;
  };
  return;
}

var env = process.env || {};
var execPath = process.execPath;
var isWin = process.platform === 'win32';
var paths = module.paths.map(formatPath);
var globalDir = formatPath(getGlobalDir());
var appDataDir = formatPath(env.APPDATA, 'npm');
var pluginsPath = formatPath(config.baseDir);

if (typeof execPath !== 'string') {
  execPath = '';
}

paths = paths.filter(function (p) {
  return p;
});

if (paths.indexOf(pluginsPath) == -1) {
  paths.unshift(pluginsPath);
}

pluginsPath = formatPath(env.WHISTLE_PLUGINS_PATH);
if (pluginsPath && paths.indexOf(pluginsPath) == -1) {
  paths.unshift(pluginsPath);
}
if (!config.customPluginPaths || !config.customPluginPaths.length) {
  paths.unshift(config.CUSTOM_PLUGIN_PATH);
}
paths = addon.concat(paths);
addDebugPaths(paths);

var nvmBin = env.NVM_BIN;
if (nvmBin && typeof nvmBin === 'string') {
  nvmBin = formatPath(path.join(nvmBin, '../lib'));
  if (paths.indexOf(nvmBin) == -1) {
    paths.push(nvmBin);
  }
}

if (appDataDir && paths.indexOf(appDataDir) == -1) {
  paths.push(appDataDir);
}

if (globalDir && paths.indexOf(globalDir) == -1) {
  paths.push(globalDir);
}
if (env.PATH && typeof env.PATH === 'string') {
  var list = env.PATH.trim().split(isWin ? ';' : ':');
  ['', '../', '../lib'].forEach(function (prefix) {
    list.forEach(function (dir) {
      dir = formatPath(dir, prefix);
      addPluginPath(dir);
    });
  });
}

function addPluginPath(dir) {
  dir && paths.indexOf(dir) == -1 && paths.push(dir);
}

function formatPath(dir, prefix) {
  if (typeof dir !== 'string' || !(dir = dir.trim())) {
    return null;
  }
  if (/(?:^|\/|\\)node_modules[\\\/]?$/.test(dir)) {
    return dir.replace(/\\/g, '/');
  }
  return path
    .resolve(dir, typeof prefix === 'string' ? prefix : '', 'node_modules')
    .replace(/\\/g, '/');
}

function getGlobalDir() {
  var globalPrefix;
  if (env.PREFIX) {
    globalPrefix = env.PREFIX;
  } else if (isWin) {
    globalPrefix = execPath && path.dirname(execPath);
  } else {
    globalPrefix = execPath && path.dirname(path.dirname(execPath));
    if (env.DESTDIR && typeof env.DESTDIR === 'string') {
      globalPrefix = path.join(env.DESTDIR, globalPrefix);
    }
  }
  if (typeof globalPrefix !== 'string') {
    return;
  }
  return formatPath(globalPrefix, isWin ? '' : 'lib');
}
paths = uniqueArr(paths);
exports.getPaths = function () {
  return paths;
};
