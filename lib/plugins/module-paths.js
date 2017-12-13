var path = require('path');
var config = require('../config');
if (config.pluginPaths) {
  exports.getPaths = function() {
    return config.pluginPaths;
  };
  return;
}

var env = process.env || {};
var execPath = process.execPath;
var isWin = process.platform === 'win32';
var paths = module.paths.map(formatPath);
var globalDir = formatPath(getGlobalDir());
var appDataDir = formatPath(env.APPDATA);
var pluginsPath = formatPath(path.join(config.baseDir, 'node_modules'));

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
if (pluginsPath) {
  pluginsPath = path.join(pluginsPath, 'node_modules');
  paths.indexOf(pluginsPath) == -1 && paths.unshift(pluginsPath);
}

if (appDataDir) {
  appDataDir = path.join(appDataDir, 'npm/node_modules');
  paths.indexOf(appDataDir) == -1 && paths.push(appDataDir);
}

if (globalDir && paths.indexOf(globalDir) == -1) {
  paths.push(globalDir);
}

function formatPath(path) {
  return typeof path == 'string' ? path.replace(/\\/g, '/') : null;
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
  if (isWin) {
    return path.resolve(globalPrefix, 'node_modules');
  }
  return path.resolve(globalPrefix, 'lib', 'node_modules');
}

exports.getPaths = function() {
  return paths;
};


