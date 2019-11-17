var cp = require('child_process');
var util = require('util');
var os = require('os');
var fs = require('fs');
var fse = require('fs-extra2');
var config = require('../lib/config');
var colors = require('colors/safe');
var path = require('path');
/*eslint no-console: "off"*/
var CHECK_RUNNING_CMD = process.platform === 'win32' ? 
  'tasklist /fi "PID eq %s" | findstr /i "node.exe"'
  : 'ps -f -p %s | grep "node"';
var isWin = process.platform === 'win32';
  
function isRunning(pid, callback) {
  pid ? cp.exec(util.format(CHECK_RUNNING_CMD, pid), 
    function (err, stdout, stderr) {
      callback(!err && !!stdout.toString().trim());
    }) : callback();
}

exports.isRunning = isRunning;

function getIpList() {
  var ipList = [];
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function(ifname) {
    ifaces[ifname].forEach(function (iface) {
      if (iface.family == 'IPv4') {
        ipList.push(iface.address);
      }
    });
  });
  var index = ipList.indexOf('127.0.0.1');
  if (index !== -1) {
    ipList.splice(index, 1);
  }
  ipList.unshift('127.0.0.1');
  return ipList;
}

function error(msg) {
  console.log(colors.red(msg));
}

function warn(msg) {
  console.log(colors.yellow(msg));
}

function info(msg) {
  console.log(colors.green(msg));
}
exports.error = error;
exports.warn = warn;
exports.info = info;

function showKillError() {
  error('[!] Cannot kill ' + config.name + ' owned by root');
  info('[i] Try to run command ' + (isWin ? 'as an administrator' : 'with `sudo`'));
}

exports.showKillError = showKillError;

function showUsage(isRunning, options, restart) {
  if (isRunning) {
    if (restart) {
      showKillError();
    } else {
      warn('[!] ' + config.name + '@' + config.version + ' is running');
    }
  } else {
    info('[i] ' + config.name + '@' + config.version + (restart ? ' restarted' : ' started'));
  }
  var port = /^\d+$/.test(options.port) && options.port > 0 ?  options.port : config.port;
  var list = options.host ? [options.host] : getIpList();
  info('[i] 1. use your device to visit the following URL list, gets the ' + colors.bold('IP') + ' of the URL you can access:');
  info(list.map(function(ip) {
    return '       http://' + colors.bold(ip) + (port ? ':' + port : '') + '/';
  }).join('\n'));

  warn('       Note: If all the above URLs are unable to access, check the firewall settings');
  warn('             For help see ' + colors.bold('https://github.com/avwo/whistle'));
  info('[i] 2. configure your device to use ' + config.name + ' as its HTTP and HTTPS proxy on ' + colors.bold('IP:') + port);
  info('[i] 3. use ' + colors.bold('Chrome') + ' to visit ' + colors.bold('http://' + (options.localUIHost || config.localUIHost) + '/') + ' to get started');

  if (parseInt(process.version.slice(1), 10) < 6) {
    warn(colors.bold('\nWarning: The current Node version is too low, access https://nodejs.org to install the latest version, or may not be able to Capture HTTPS CONNECTs\n'));
  }
}

exports.showUsage = showUsage;

function getHomedir() {
  //默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
    process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

function getDataDir() {
  return path.resolve(getHomedir(), '.startingAppData');
}

function readConfig(storage) {
  var dataDir = getDataDir();
  var configFile = path.join(dataDir, encodeURIComponent('#' + (storage ? storage + '#' : '')));
  if (!fs.existsSync(configFile)) {
    return;
  }
  try {
    return fse.readJsonSync(configFile);
  } catch(e) {}
}

function readConfigList() {
  var dataDir = getDataDir();
  var result = [];
  try {
    fs.readdirSync(dataDir).forEach(function(dir) {
      try {
        dir = decodeURIComponent(dir);
        var lastIndex = dir.length - 1;
        if (dir[0] === '#' && dir[lastIndex] === '#') {
          dir = dir.substring(1, lastIndex || 1);
          var config = readConfig(dir);
          if (config && config.pid && config.options) {
            result.push(config);
          }
        }
      } catch(e) {}
    });
  } catch(e) {}
  return result;
}

exports.readConfig = readConfig;
exports.readConfigList = readConfigList;