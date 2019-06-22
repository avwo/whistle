var os = require('os');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra2');

var WHISLTE_PLUGIN_RE = /^(@[\w\-]+\/)?whistle\.[a-z\d_\-]+$/;
var PLUGIN_PATH = path.join(getWhistlePath(), 'plugins');

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

function ensureExists() {
  fse.ensureDirSync(PLUGIN_PATH);
  fs.writeFileSync(path.join(PLUGIN_PATH, 'package.json'), '{"repository":"https://github.com/avwo/whistle","license":"MIT"}');
  fs.writeFileSync(path.join(PLUGIN_PATH, 'LICENSE'), 'Copyright (c) 2019 avwo');
  fs.writeFileSync(path.join(PLUGIN_PATH, 'README.md'), 'https://github.com/avwo/whistle');
}

var RESOLVED_FILES = ['node_modules', 'package.json', 'LICENSE', 'README.md'];

exports.install = function(cmd, argv) {
  if (!getPlugins(argv).length) {
    return;
  }
  ensureExists();
  var files = fs.readdirSync(PLUGIN_PATH);
  files && files.forEach(function(name) {
    if (RESOLVED_FILES.indexOf(name) === -1) {
      try {
        fse.removeSync(path.join(PLUGIN_PATH, name));
      } catch(e) {}
    }
  });
  argv.push('--no-package-lock');
  cp.spawn(cmd, argv, {
    stdio: 'inherit',
    cwd: PLUGIN_PATH
  });
};

exports.uninstall = function(plugins) {
  ensureExists();
  plugins = getPlugins(plugins);
  plugins.forEach(function(name) {
    cp.spawn('npm', ['uninstall', name], {
      stdio: 'inherit',
      cwd: PLUGIN_PATH
    });
  });
};

exports.run = function(cmd, argv) {
  var newPath = [path.join(PLUGIN_PATH, 'node_modules/.bin')];
  process.env.PATH && newPath.push(process.env.PATH);
  newPath = newPath.join(os.platform() === 'win32' ? ';' : ':');
  process.env.PATH = newPath;
  cp.spawn(cmd, argv, {
    stdio: 'inherit',
    env: process.env
  });
};
