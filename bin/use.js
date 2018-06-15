var path = require('path');
var os = require('os');
var util = require('util');
var cp = require('child_process');
var fs = require('fs');
var colors = require('colors/safe');
var fse = require('fs-extra2');
var getPluginPaths = require('../lib/plugins/module-paths').getPaths;

var CHECK_RUNNING_CMD = process.platform === 'win32' ? 
  'tasklist /fi "PID eq %s" | findstr /i "node.exe"'
  : 'ps -f -p %s | grep "node"';

function getHomedir() {
  //默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
    process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

function isRunning(pid, callback) {
  pid ? cp.exec(util.format(CHECK_RUNNING_CMD, pid), 
    function (err, stdout, stderr) {
      callback(!err && !!stdout.toString().trim());
    }) : callback(false);
}

function showStartWhistleTips() {
  // TODO: xxx
  console.log(colors.red('请先执行 `w2 start` 启动whistle.'));
}

function handleRules(options, filepath, callback) {
  var getRules = require(filepath);
  if (typeof getRules !== 'function') {
    return callback(getRules);
  }
  getRules(options, callback);
}

function getString(str) {
  return typeof str !== 'string' ? '' : str.trim();
}
   
module.exports = function(filepath, storage) {
  var dataDir = path.resolve(getHomedir(), '.startingAppData');
  var configFile = path.join(dataDir, encodeURIComponent('#' + (storage ? storage + '#' : '')));
  if (!fs.existsSync(configFile)) {
    return showStartWhistleTips();
  }
  var pid, options;
  try {
    var config = fse.readJsonSync(configFile);
    options = config.options;
    pid = options && config.pid;
  } catch(e) {}
  isRunning(pid, function(running) {
    if (!running) {
      return showStartWhistleTips();
    }
    filepath = path.resolve(filepath || '.whistle.js');
    var port = options.port > 0 ? options.port : 8899;
    handleRules({
      pluginPaths: getPluginPaths(),
      port: port
    }, filepath, function(rules) {
      if (!rules) {
        // TODO: xxx
        return;
      }
      var name = getString(rules.name);
      if (!name) {
        // TODO: xxx
        return;
      }
      if (name.length > 64) {
        // TODO: xxx
        return;
      }
    });
  });
};