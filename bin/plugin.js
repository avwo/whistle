var os = require('os');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra2');
var getHash = require('./util').getHash;
var commonUtil = require('../lib/util/common');

var getWhistlePath = commonUtil.getWhistlePath;
var REMOTE_URL_RE = commonUtil.REMOTE_URL_RE;
var CMD_SUFFIX = process.platform === 'win32' ? '.cmd' : '';
var CUSTOM_PLUGIN_PATH = path.join(getWhistlePath(), 'custom_plugins');
var PACKAGE_JSON = '{"repository":"https://github.com/avwo/whistle","license":"MIT"}';
var LICENSE = 'Copyright (c) 2019 avwo';
var RESP_URL = 'https://github.com/avwo/whistle';
var WHISTLE_PLUGIN_RE = /^((?:@[\w-]+\/)?whistle\.[a-z\d_-]+)(?:\@([\w.^~*-]*))?$/;

function getInstallPath(name, dir) {
  return path.join(dir || CUSTOM_PLUGIN_PATH, name);
}

function getPlugins(argv, isInstall) {
  return argv.filter(function(name, i) {
    if (WHISTLE_PLUGIN_RE.test(name)) {
      return true;
    }
    if (argv[i - 1] === '--registry') {
      return false;
    }
    return isInstall && REMOTE_URL_RE.test(name);
  });
}

function removeDir(installPath) {
  if (fs.existsSync(installPath))  {
    fse.removeSync(installPath);
  }
}

function getTempName(name) {
  if (name.indexOf('/') === -1) {
    return '.' + name;
  }
  name = name.split('/');
  var lastIndex = name.length - 1;
  name[lastIndex] = '.' + name[lastIndex];
  return name.join('/');
}

function getInstallDir(argv) {
  argv = argv.slice();
  var result = { argv: argv };
  for (var i = 0, len = argv.length; i < len; i++) {
    var option = argv[i];
    if (option && option.indexOf('--dir=') === 0) {
      var dir = option.substring(option.indexOf('=') + 1);
      result.dir = dir && path.resolve(dir);
      argv.splice(i, 1);
      return result;
    }
  }
  return result;
}

function getPluginNameFormDeps(deps) {
  var keys = Object.keys(deps);
  for (var i = 0, len = keys.length; i < len; i++) {
    if (WHISTLE_PLUGIN_RE.test(keys[i])) {
      return RegExp.$1;
    }
  }
}

function getPkgName(name) {
  if (/[/\\](whistle\.[a-z\d_-]+)(?:\.git)?$/.test(name)) {
    return RegExp.$1;
  }
  return getHash(name);
}

function install(cmd, name, argv, ver, pluginsCache, callback) {
  var result = getInstallDir(argv.slice());
  var isPkg = WHISTLE_PLUGIN_RE.test(name);
  var pkgName = isPkg ? name : getPkgName(name);
  var installPath = getInstallPath(getTempName(pkgName), result.dir);
  argv = result.argv;
  fse.ensureDirSync(installPath);
  fse.emptyDirSync(installPath);
  var pkgJson = PACKAGE_JSON;
  if (ver) {
    pkgJson = pkgJson.replace(',', ',"dependencies":{"' + name + '":"' + ver + '"},');
  }
  fs.writeFileSync(path.join(installPath, 'package.json'), pkgJson);
  fs.writeFileSync(path.join(installPath, 'LICENSE'), LICENSE);
  fs.writeFileSync(path.join(installPath, 'README.md'), RESP_URL);
  argv.unshift('install', name);
  pluginsCache[pkgName] = 1;
  cp.spawn(cmd, argv, {
    stdio: 'inherit',
    cwd: installPath
  }).once('exit', function(code) {
    if (code) {
      removeDir(installPath);
      callback();
    } else {
      if (!isPkg) {
        var deps = fse.readJsonSync(path.join(installPath, 'package.json')).dependencies;
        name = deps && getPluginNameFormDeps(deps);
      }
      if (!name) {
        try {
          removeDir(installPath);
        } catch (e) {}
        return callback();
      }
      var realPath = getInstallPath(name, result.dir);
      removeDir(realPath);
      try {
        fs.renameSync(installPath, realPath);
      } catch (e) {
        fse.ensureDirSync(realPath);
        fse.copySync(installPath, realPath);
        try {
          removeDir(installPath);
        } catch (e) {}
      }
      var pkgPath = path.join(realPath, 'node_modules', name, 'package.json');
      try {
        if (fs.statSync(pkgPath).mtime.getFullYear() < 2010) {
          var now = new Date();
          fs.utimesSync(pkgPath, now, now);
        }
      } catch (e) {}
      callback(pkgPath);
    }
  });
}

function readJson(pkgPath) {
  try {
    return fse.readJsonSync(pkgPath);
  } catch (e) {
    try {
      return fse.readJsonSync(pkgPath);
    } catch (e) {}
  }
}

function installPlugins(cmd, plugins, argv, pluginsCache, deep) {
  deep = deep || 0;
  var count = 0;
  var peerPlugins = [];
  var callback = function(pkgPath) {
    if (pkgPath) {
      var pkg = readJson(pkgPath) || {};
      var list = pkg.whistleConfig && (pkg.whistleConfig.peerPluginList || pkg.whistleConfig.peerPlugins);
      if (Array.isArray(list) && list.length < 16) {
        list.forEach(function(name) {
          name = typeof name === 'string' ? name.trim() : null;
          if (name && (WHISTLE_PLUGIN_RE.test(name) || REMOTE_URL_RE.test(name))) {
            name = RegExp.$1;
            if (peerPlugins.indexOf(name) === -1) {
              peerPlugins.push(name);
            }
          }
        });
      }
    }
    if (--count <= 0 && deep < 16) {
      peerPlugins = peerPlugins.filter(function(name) {
        return !pluginsCache[name];
      });
      peerPlugins.length && installPlugins(cmd, peerPlugins, argv, pluginsCache, ++deep);
    }
  };
  plugins.forEach(function(name) {
    var isPkg = WHISTLE_PLUGIN_RE.test(name);
    if (isPkg || REMOTE_URL_RE.test(name)) {
      ++count;
      name = RegExp.$1;
      var ver = RegExp.$2;
      install(cmd, name, argv, ver, pluginsCache, callback);
    }
  });
}

exports.getWhistlePath = getWhistlePath;

exports.install = function(cmd, argv) {
  var plugins = getPlugins(argv, true);
  if (!plugins.length) {
    return;
  }
  argv = argv.filter(function(name) {
    return plugins.indexOf(name) === -1;
  });
  
  cmd += CMD_SUFFIX;
  argv.push('--no-package-lock');
  installPlugins(cmd, plugins, argv, {});
};

exports.uninstall = function(plugins) {
  var result = getInstallDir(plugins);
  plugins = result.argv;
  getPlugins(plugins).forEach(function(name) {
    if (WHISTLE_PLUGIN_RE.test(name)) {
      name = RegExp.$1;
      removeDir(getInstallPath(name, result.dir));
    }
  });
};

exports.run = function(cmd, argv) {
  var newPath = [];
  fse.ensureDirSync(CUSTOM_PLUGIN_PATH);
  fs.readdirSync(CUSTOM_PLUGIN_PATH).forEach(function(name) {
    if (!name.indexOf('whistle.')) {
      newPath.push(path.join(CUSTOM_PLUGIN_PATH, name, 'node_modules/.bin'));
    } else if (name[0] === '@') {
      try {
        fs.readdirSync(path.join(CUSTOM_PLUGIN_PATH, name)).forEach(function(modName) {
          newPath.push(path.join(CUSTOM_PLUGIN_PATH, name, modName, 'node_modules/.bin'));
        });
      } catch (e) {}
    }
  });
  process.env.PATH && newPath.push(process.env.PATH);
  newPath = newPath.join(os.platform() === 'win32' ? ';' : ':');
  process.env.PATH = newPath;
  cp.spawn(cmd + CMD_SUFFIX, argv, {
    stdio: 'inherit',
    env: process.env
  });
};
