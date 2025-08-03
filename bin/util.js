var cp = require('child_process');
var program = require('starting');
var util = require('util');
var os = require('os');
var fs = require('fs');
var fse = require('fs-extra2');
var config = require('../lib/config');
var common = require('../lib/util/common');
var colors = require('colors/safe');
var path = require('path');
var createHmac = require('crypto').createHmac;

var joinIpPort = common.joinIpPort;

exports.joinIpPort = joinIpPort;
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
      if (iface.family == 'IPv4' || iface.family === 4) {
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
  info('[i] Try to run command ' + (isWin ? 'as an administrator' : 'with sudo'));
}

exports.showKillError = showKillError;

function showUsage(isRunning, options, restart) {
  options = formatOptions(options);
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
  var list = options.host && typeof options.host === 'string' ? [options.host] : getIpList();
  var oneIp = list.length === 1;
  var index = 0;
  if (!oneIp) {
    info('[i] ' + (++index) + '. Use your device to visit these URLs and note which one works:');
    info(list.map(function(ip) {
      return '       http://' + colors.bold(joinIpPort(ip, port != 80 && port)) + '/';
    }).join('\n'));
    warn('       Note: If none are accessible, check your firewall settings');
    warn('             For help, see ' + colors.bold('https://github.com/avwo/whistle'));
  }
  info('[i] ' + (++index) + '. set your device\'s HTTP PROXY to ' + colors.bold((oneIp ? 'IP(' + list[0] + ')' : 'the working IP') + ' & PORT(' + port + ')'));
  info('[i] ' + (++index) + '. open ' + colors.bold('Chrome') + ' and visit ' + colors.bold('http://' + (options.localUIHost || config.localUIHost) + '/') + ' to begin');

  var bypass = program.init;
  if (bypass == null) {
    return;
  }
  return {
    host: options.host || '127.0.0.1',
    port: port,
    bypass: typeof bypass === 'string' ? bypass : undefined
  };
}

exports.showUsage = showUsage;

function getDataDir() {
  return path.resolve(config.getHomedir(), '.startingAppData');
}

function formatOptions(options) {
  if (!options || (!/^(?:([\w.-]+):)?([1-9]\d{0,4})$/.test(options.port) &&
    !/^\[([\w.:]+)\]:([1-9]\d{0,4})$/.test(options.port))) {
    return options;
  }
  options.host = options.host || RegExp.$1;
  options.port = parseInt(RegExp.$2, 10);
  return options;
}

exports.formatOptions = formatOptions;

function readConfig(storage) {
  var dataDir = getDataDir();
  var configFile = path.join(dataDir, encodeURIComponent('#' + (storage ? storage + '#' : '')));
  if (!fs.existsSync(configFile)) {
    return;
  }
  try {
    var conf = fse.readJsonSync(configFile);
    conf && formatOptions(conf.options);
    return conf;
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
exports.getHash = function(str) {
  var hmac = createHmac('sha256', '5b6af7b9884e1165');
  return hmac.update(str).digest('hex');
};

exports.getDefaultPort = function () {
  var conf = readConfig();
  conf = conf && conf.options;
  var port = conf && conf.port;
  return port > 0 ? port : 8899;
};
