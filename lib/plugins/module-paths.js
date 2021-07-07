var path = require('path');
var config = require('../config');

var addon = (config.addon || []).map(function(str) {
  return path.resolve(str);
});
addon = addon.concat(addon.map(formatPath));

config.systemPluginPath = formatPath(config.SYSTEM_PLUGIN_PATH);

function addDebugPaths(plugins) {
  if (config.debugMode) {
    var cwd = process.cwd();
    plugins.unshift(cwd);
    var pluginDirRe = /[/\\]whistle\.[a-z\d_-]+[/\\]?$/;
    if (pluginDirRe.test(cwd)) {
      plugins.unshift(cwd.replace(pluginDirRe, '/'));
    }
  }
}

var pluginPaths = config.pluginPaths;
if (pluginPaths) {
  config.pluginPaths = pluginPaths.concat(pluginPaths.map(formatPath).concat(addon));
  addDebugPaths(config.pluginPaths);
  exports.getPaths = function() {
    return config.pluginPaths;
  };
  return;
}

if (config.noGlobalPlugins) {
  addDebugPaths(addon);
  exports.getPaths = function() {
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

paths = paths.filter(function(p) {
  return p;
});

if (paths.indexOf(pluginsPath) == -1) {
  paths.unshift(pluginsPath);
}

pluginsPath = formatPath(env.WHISTLE_PLUGINS_PATH);
if (pluginsPath && paths.indexOf(pluginsPath) == -1) {
  paths.unshift(pluginsPath);
}

paths.unshift(config.CUSTOM_PLUGIN_PATH, config.systemPluginPath);
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
  ['', '../', '../lib'].forEach(function(prefix) {
    list.forEach(function(dir) {
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
  return path.resolve(dir, typeof prefix === 'string' ?  prefix : '', 'node_modules').replace(/\\/g, '/');
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

exports.getPaths = function() {
  return paths;
};


