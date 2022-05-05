var execSync = require('child_process').execSync;
var join = require('path').join;

var REFRESH_PROXY = join(__dirname, 'refresh');
var REG_PATH = 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v';

exports.enableProxy = function(options) {
  var bypass = options.bypass;
  var setCmd = REG_PATH + ' ProxyServer /t REG_SZ /d ' + options.host + ':' + options.port + ' /f';
  var enableCmd = REG_PATH + ' ProxyEnable /t REG_DWORD /d 1 /f';
  var cmd = setCmd + ' & ' + enableCmd;

  if (bypass) {
    bypass = REG_PATH + ' ProxyOverride /t REG_SZ /d "' + bypass.join(';') + '" /f';
    cmd = cmd + ' & ' + bypass;
  }
  var result = execSync(cmd);
  execSync(REFRESH_PROXY);
  return result;
};

exports.disableProxy = function() {
  var result = execSync(REG_PATH + ' /v ProxyEnable /t REG_DWORD /d 0 /f');
  execSync(REFRESH_PROXY);
  return result;
};
