var os = require('os');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra2');

var CMD_SUFFIX = process.platform === 'win32' ? '.cmd' : '';
var WHISLTE_PLUGIN_RE = /^(@[\w\-]+\/)?whistle\.[a-z\d_\-]+$/;
var PLUGIN_PATH = path.join(getWhistlePath(), 'plugins');
var CUSTOM_PLUGIN_PATH = path.join(getWhistlePath(), 'custom_plugins');
var PACKAGE_JSON = '{"repository":"https://github.com/avwo/whistle","license":"MIT"}';
var LICENSE = 'Copyright (c) 2019 avwo';
var RESP_URL = 'https://github.com/avwo/whistle';

function getInstallPath(name, dir) {
  return path.join(dir || CUSTOM_PLUGIN_PATH, name);
}

function getHomedir() {
  //默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

function getWhistlePath() {
  return process.env.WHISTLE_PATH || path.join(getHomedir(), '.WhistleAppData');
}

function getPlugins(argv) {
  return argv.filter(function(name) {
    return WHISLTE_PLUGIN_RE.test(name);
  });
}

function removeDir(installPath) {
  if (fs.existsSync(installPath))  {
    fse.removeSync(installPath);
  }
}

function removeOldPlugin(name) {
  removeDir(path.join(PLUGIN_PATH, 'node_modules', name));
  removeDir(path.join(PLUGIN_PATH, 'node_modules', getTempName(name)));
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

function install(cmd, name, argv) {
  argv = argv.slice();
  var result = getInstallDir(argv);
  argv = result.argv;
  var installPath = getInstallPath(getTempName(name), result.dir);
  fse.ensureDirSync(installPath);
  fse.emptyDirSync(installPath);
  fs.writeFileSync(path.join(installPath, 'package.json'), PACKAGE_JSON);
  fs.writeFileSync(path.join(installPath, 'LICENSE'), LICENSE);
  fs.writeFileSync(path.join(installPath, 'README.md'), RESP_URL);
  argv.unshift('install', name);
  cp.spawn(cmd, argv, {
    stdio: 'inherit',
    cwd: installPath
  }).on('exit', function(code) {
    if (code) {
      removeDir(installPath);
    } else {
      var realPath = getInstallPath(name, result.dir);
      removeDir(realPath);
      try {
        fs.renameSync(installPath, realPath);
      } catch (e) {
        fse.copySync(installPath, realPath);
        try {
          removeDir(installPath);
        } catch (e) {}
      }
      try {
        var pkgPath = path.join(realPath, 'node_modules', name, 'package.json');
        if (fs.statSync(pkgPath).mtime.getFullYear() < 2010) {
          var now = new Date();
          fs.utimesSync(pkgPath, now, now);
        }
      } catch (e) {}
    }
  });
}

exports.install = function(cmd, argv) {
  var plugins = getPlugins(argv);
  if (!plugins.length) {
    return;
  }
  argv = argv.filter(function(name) {
    return plugins.indexOf(name) === -1;
  });
  
  cmd += CMD_SUFFIX;
  argv.push('--no-package-lock');
  plugins.forEach(function(name) {
    removeOldPlugin(name);
    install(cmd, name, argv);
  });
};

exports.uninstall = function(plugins) {
  var result = getInstallDir(plugins);
  plugins = result.argv;
  getPlugins(plugins).forEach(function(name) {
    !result.dir && removeOldPlugin(name);
    removeDir(getInstallPath(name, result.dir));
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
