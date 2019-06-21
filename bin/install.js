var os = require('os');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra2');

var WHISLTE_PLUGIN_RE = /^(@[\w\-]+\/)?whistle\.[a-z\d_\-]+$/;

function getHomedir() {
  //默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

function checkPlugins(argv) {
  for (var i = 0, len = argv.length; i < len; i++) {
    if (WHISLTE_PLUGIN_RE.test(argv[i])) {
      return true;
    }
  }
  return false;
}

module.exports = function(cmd, argv) {
  if (!checkPlugins(argv)) {
    return;
  }
  var pluginPath = path.join(getHomedir(), '.WhistleAppData/plugins');
  fse.ensureDirSync(pluginPath);
  var files = fs.readdirSync(pluginPath);
  files && files.forEach(function(name) {
    if (name !== 'node_modules') {
      try {
        fse.removeSync(path.join(pluginPath, name));
      } catch(e) {}
    }
  });
  cp.spawn(cmd, argv, {
    stdio: 'inherit',
    cwd: pluginPath
  });
};
