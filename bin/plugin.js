var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra2');
var getHash = require('./util').getHash;
var common = require('../lib/util/common');

var getWhistlePath = common.getWhistlePath;
var WHISTLE_PLUGIN_RE = common.WHISTLE_PLUGIN_RE;
var getPlugins = common.getPlugins;
var CMD_SUFFIX = process.platform === 'win32' ? '.cmd' : '';
var CUSTOM_PLUGIN_PATH = process.env.WHISTLE_CUSTOM_PLUGINS_PATH || path.join(getWhistlePath(), 'custom_plugins');
var DEFAULT_PATH = common.getDefaultWhistlePath();
var REGISTRY_LIST = path.join(DEFAULT_PATH, '.registry.list');
var PACKAGE_JSON = '{"repository":"https://github.com/avwo/whistle","license":"MIT"}';
var LICENSE = 'Copyright (c) 2019 avwo';
var RESP_URL = 'https://github.com/avwo/whistle';
var MAX_REG_COUNT = 100;

function getInstallPath(name, dir) {
  return path.join(dir || CUSTOM_PLUGIN_PATH, name);
}

function removeDirSync(installPath) {
  try {
    fse.removeSync(installPath);
  } catch (e) {}
}

function removeTempFiles(argv) {
  argv.forEach(function(file) {
    if (file.indexOf('file:') === 0) {
      fs.unlink(file.substring(5), common.noop);
    }
  });
}

function renameDirSync(installPath, realPath) {
  fse.ensureDirSync(realPath);
  fse.copySync(installPath, realPath);
  removeDirSync(installPath);
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

function formatCmdOptions(options) {
  if (CMD_SUFFIX) {
    options.shell = true;
    options.windowsHide = true;
  }
  return options;
}

exports.formatCmdOptions = formatCmdOptions;

function getValue(str) {
  if (str[0] !== '"') {
    return str;
  }
  var len = str.length - 1;
  return str[len] === '"' ? str.substring(1, len) : str;
}

function parseDir(dir) {
  if (!dir) {
    return;
  }
  dir = getValue(dir);
  if (/^~(~)?(?:$|[\/])/.test(dir)) {
    var wave = RegExp.$1;
    var all = RegExp['$&'];
    return path.resolve(wave ? getWhistlePath() : common.getHomedir(), dir.substring(all.length));
  }
  if (common.isWhistleName(dir)) {
    return path.resolve(getWhistlePath(), 'all_whistles/' + dir + '/custom_plugins');
  }
  return path.resolve(dir);
}

function getInstallDir(argv) {
  argv = argv.slice();
  var result = { argv: argv };
  for (var i = 0, len = argv.length; i < len; i++) {
    var option = argv[i];
    if (option === '--dir') {
      result.dir = parseDir(argv[i + 1]);
      argv.splice(i, 2);
      return result;
    }
    if (option && option.indexOf('--dir=') === 0) {
      var dir = option.substring(option.indexOf('=') + 1);
      result.dir = parseDir(dir);
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

function install(cmd, name, argv, ver, pluginsCache, callback, handleError) {
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
  var done;
  var child = cp.spawn(cmd, argv, formatCmdOptions({
    stdio: 'inherit',
    cwd: installPath
  }));
  child.once('exit', function(code) {
    !done && handleError && removeTempFiles(argv);
    if (code) {
      if (done) {
        return;
      }
      done = true;
      removeDirSync(installPath);
      callback();
      handleError && handleError('Install plugin \'' + name + '\' failed with code: ' + code);
    } else {
      done = true;
      if (!isPkg) {
        var deps = common.readJsonSync(path.join(installPath, 'package.json'));
        deps = deps && deps.dependencies;
        name = deps && getPluginNameFormDeps(deps);
      }
      if (!name) {
        removeDirSync(installPath);
        return callback();
      }
      var realPath = getInstallPath(name, result.dir);
      removeDirSync(realPath);
      try {
        fs.renameSync(installPath, realPath);
      } catch (e) {
        if (handleError) {
          try {
            renameDirSync(installPath, realPath);
          } catch (e) {
            handleError(e);
          }
        } else {
          renameDirSync(installPath, realPath);
        }
      }
      var pkgPath = path.join(realPath, 'node_modules', name, 'package.json');
      var stats = common.getStatSync(pkgPath);
      if (stats && stats.mtime.getFullYear() < 2010) {
        var now = new Date();
        try {
          fs.utimesSync(pkgPath, now, now);
        } catch (e) {}
      }
      callback(pkgPath);
    }
  });
  if (handleError) {
    child.on('error', function(err) {
      if (done) {
        return;
      }
      done = true;
      handleError(err);
      removeTempFiles(argv);
      removeDirSync(installPath);
      callback();
    });
  }
}

function getRegistry(argv) {
  for (var i = 0, len = argv.length; i < len; i++) {
    var name = argv[i];
    if (name === '--registry') {
      return common.getRegistry(argv[i + 1]);
    }
    if (/^--registry=(.+)/.test(name)) {
      return common.getRegistry(RegExp.$1);
    }
  }
}

function installPlugins(cmd, plugins, argv, pluginsCache, deep, handleError) {
  deep = deep || 0;
  var count = 0;
  var peerPlugins = [];
  var registry = getRegistry(argv);
  var callback = function(pkgPath) {
    if (pkgPath) {
      var pkg = common.readJsonSync(pkgPath) || {};
      var list = pkg.whistleConfig && (pkg.whistleConfig.peerPluginList || pkg.whistleConfig.peerPlugins);
      if (Array.isArray(list) && list.length < 16) {
        list.forEach(function(name) {
          name = typeof name === 'string' ? name.trim() : null;
          if (WHISTLE_PLUGIN_RE.test(name)) {
            name = RegExp.$1;
            if (peerPlugins.indexOf(name) === -1) {
              peerPlugins.push(name);
            }
          }
        });
      }
      if (registry) {
        try {
          fse.ensureDirSync(DEFAULT_PATH);
        } catch (e) {}
        var regList = common.readJsonSync(REGISTRY_LIST);
        var result = [registry];
        registry = null;
        if (Array.isArray(regList)) {
          regList.forEach(function(url) {
            url = common.getRegistry(url);
            if (url && result.indexOf(url) === -1) {
              result.push(url);
            }
          });
        }
        try {
          if (REGISTRY_LIST.length > MAX_REG_COUNT) {
            REGISTRY_LIST = REGISTRY_LIST.slice(0, MAX_REG_COUNT);
          }
          fse.writeJsonSync(REGISTRY_LIST, result);
        } catch (e) {
          try {
            fse.writeJsonSync(REGISTRY_LIST, result);
          } catch (e) {}
        }
      }
    }
    if (--count <= 0 && deep < 16) {
      peerPlugins = peerPlugins.filter(function(name) {
        return !pluginsCache[name];
      });
      peerPlugins.length && installPlugins(cmd, peerPlugins, argv, pluginsCache, ++deep, handleError);
    }
  };
  plugins.forEach(function(name) {
    var ver;
    if (WHISTLE_PLUGIN_RE.test(name)) {
      name = RegExp.$1;
      ver = RegExp.$2;
    } else if (!common.isPluginAddr(name)) {
      return;
    }
    ++count;
    install(cmd, name, argv, ver, pluginsCache, callback, handleError);
  });
}

exports.getWhistlePath = getWhistlePath;

exports.install = function(cmd, argv, handleError) {
  var restArgv = [];
  var plugins = getPlugins(argv, true, restArgv);
  if (!plugins.length) {
    return;
  }
  cmd += CMD_SUFFIX;
  restArgv.push('--no-package-lock');
  installPlugins(cmd, plugins, restArgv, {}, 0, handleError);
};

exports.uninstall = function(plugins) {
  var result = getInstallDir(plugins);
  plugins = result.argv;
  getPlugins(plugins).forEach(function(name) {
    if (WHISTLE_PLUGIN_RE.test(name)) {
      name = RegExp.$1;
      removeDirSync(getInstallPath(name, result.dir));
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
  newPath = newPath.join(CMD_SUFFIX ? ';' : ':');
  process.env.PATH = newPath;
  cp.spawn(cmd + CMD_SUFFIX, argv, formatCmdOptions({
    stdio: 'inherit',
    env: process.env
  }));
};
