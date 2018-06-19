var cp = require('child_process');
var util = require('util');
var os = require('os');
var config = require('../lib/config');
var colors = require('colors/safe');
/*eslint no-console: "off"*/
var CHECK_RUNNING_CMD = process.platform === 'win32' ? 
  'tasklist /fi "PID eq %s" | findstr /i "node.exe"'
  : 'ps -f -p %s | grep "node"';
  
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

function showUsage(isRunning, options, restart) {
  var port = options.port || config.port;
  if (isRunning) {
    warn('[!] ' + config.name + '@' + config.version + ' is running');
  } else {
    info('[i] ' + config.name + '@' + config.version + (restart ? ' restarted' : ' started'));
  }

  info('[i] First, use your device to visit the following URL list, gets the ' + colors.bold('IP') + ' of the URL you can visit:');
  info(getIpList().map(function(ip) {
    return '    http://' + colors.bold(ip) + (port ? ':' + port : '') + '/';
  }).join('\n'));

  warn('    Note: If the following URLs are unable to access, check the server\'s firewall settings');
  warn('          For more information, please visit ' + colors.bold('https://github.com/avwo/whistle'));
  info('[i] Second, configure your device to use ' + config.name + ' as its HTTP and HTTPS proxy on ' + colors.bold('IP:') + port);
  info('[i] Last, use ' + colors.bold('Chrome') + ' to visit ' + colors.bold('http://' + (options.localUIHost || config.localUIHost) + '/') + ' to get started');

  if (parseInt(process.version.slice(1), 10) < 6) {
    warn(colors.bold('\nWarning: The current Node version is too low, access https://nodejs.org to install the latest version, or may not be able to intercept HTTPS CONNECTs\n'));
  }
}

exports.showUsage = showUsage;