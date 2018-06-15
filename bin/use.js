var path = require('path');
var os = require('os');
var util = require('util');
var cp = require('child_process');
var fs = require('fs');
var colors = require('colors/safe');
var fse = require('fs-extra2');
var getPluginPaths = require('../lib/plugins/module-paths').getPaths;

/*eslint no-console: "off"*/
var pluginPaths = getPluginPaths();
var MAX_RULES_LEN = 1024 * 16;
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

function showStartWhistleTips(storage) {
  console.log(colors.red('Please execute `w2 start' + (storage ? ' -S ' + storage : '')
    + '` to start whistle first.'));
}

function handleRules(filepath, callback, port) {
  var getRules = require(filepath);
  if (typeof getRules !== 'function') {
    return callback(getRules);
  }
  getRules(callback, {
    port: port,
    existsPlugin: existsPlugin
  });
}

function getString(str) {
  return typeof str !== 'string' ? '' : str.trim();
}

function existsPlugin(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  for (var i = 0, len = pluginPaths.length; i < len; i++) {
    try {
      if (fs.statSync(path.join(pluginPaths[i], name)).isDirectory()) {
        return true;
      }
    } catch(e) {}
  }
  return false;
}

module.exports = function(filepath, storage) {
  var dataDir = path.resolve(getHomedir(), '.startingAppData');
  var configFile = path.join(dataDir, encodeURIComponent('#' + (storage ? storage + '#' : '')));
  if (!fs.existsSync(configFile)) {
    return showStartWhistleTips(storage);
  }
  var pid, options;
  try {
    var config = fse.readJsonSync(configFile);
    options = config.options;
    pid = options && config.pid;
  } catch(e) {}
  isRunning(pid, function(running) {
    if (!running) {
      return showStartWhistleTips(storage);
    }
    filepath = path.resolve(filepath || '.whistle.js');
    var port = options.port > 0 ? options.port : 8899;
    handleRules(filepath, function(result) {
      if (!result) {
        console.log(colors.red('name and rules cannot be empty.'));
        return;
      }
      var name = getString(result.name);
      if (!name || name.length > 64) {
        console.log(colors.red('name cannot be empty and the length cannot exceed 64 characters.'));
        return;
      }
      var rules = getString(result.rules);
      if (rules.length > MAX_RULES_LEN) {
        console.log(colors.red('rules cannot be empty and the size cannot exceed 16k.'));
        return;
      }
      console.log(colors.green('[127.0.0.1:' + port + '] Setting successful.'));
    }, port);
  });
};