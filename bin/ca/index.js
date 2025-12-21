var cp = require('child_process');
var fs = require('fs');
var common = require('../../lib/util/common');

var spawnSync = cp.spawnSync;
var execSync = cp.execSync;

function checkSuccess(result) {
  var stderr = result.stderr;
  if (stderr && stderr.length) {
    throw new Error(stderr + '');
  }
}

function getKeyChain() {
  var result = spawnSync('security', ['default-keychain']);
  checkSuccess(result);
  return (result.stdout + '').split('"')[1];
}

function installMac(certPath) {
  var result = spawnSync('security', ['add-trusted-cert', '-k', getKeyChain(), certPath]);
  checkSuccess(result);
  var msg = result.stdout + '';
  if (/Error:/i.test(msg)) {
    throw new Error(msg);
  }
}


function installWin(certFile) {
  var result = spawnSync('certutil', ['-addstore', '-user', 'Root', certFile]);
  checkSuccess(result);
  if (/ERROR_CANCELLED/i.test(result.stdout + '')) {
    throw new Error('The authorization was canceled by the user');
  }
}

var UBUNTU_CA_DIR = '/usr/local/share/ca-certificates/';
var FEDORA_CA_DIR = '/etc/pki/ca-trust/source/anchors/';

function getCAConfig() {
  var stats = common.getStatSync(UBUNTU_CA_DIR);
  if (stats && stats.isDirectory()) {
    return {
      dir: UBUNTU_CA_DIR,
      cmd: 'update-ca-certificates'
    };
  }
  return {
    dir: FEDORA_CA_DIR,
    cmd: 'update-ca-trust'
  };
}

function installLinux(certFile, execFunc) {
  var config = getCAConfig();
  var certPem = fs.readFileSync(certFile);
  var caFile = config.dir + 'whistle-' + common.createHash(certPem) + '.crt';
  certFile = '"' + certFile.replace(/"/g, '\\"') + '"';
  if (typeof execFunc === 'function') {
    execFunc('cp ' + certFile + ' ' + caFile + '&&' + config.cmd);
  } else {
    execSync('sudo cp ' + certFile + ' ' + caFile + '&&sudo ' + config.cmd);
  }
  return true;
}

module.exports = function(certFile, execFunc) {
  var platform = process.platform;
  if (platform === 'darwin') {
    return installMac(certFile);
  }
  if (platform === 'win32') {
    return installWin(certFile);
  }
  if (platform === 'linux') {
    return installLinux(certFile, execFunc);
  }
  throw new Error('Platform ' + platform + ' is currently unsupported for Root CA installation');
};
