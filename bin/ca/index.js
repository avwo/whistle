var spawnSync = require('child_process').spawnSync;

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
}


function installWin(certFile) {
  var result = spawnSync('certutil', ['-addstore', '-user', 'Root', certFile]);
  checkSuccess(result);
}

module.exports = function(certFile) {
  var platform = process.platform;
  if (platform === 'darwin') {
    return installMac(certFile);
  }
  if (platform === 'win32') {
    return installWin(certFile);
  }
  throw new Error('Platform ' + platform + ' is unsupported to install Root CA for now.');
};
