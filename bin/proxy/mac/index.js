var execSync = require('child_process').execSync;
var join = require('path').join;

var PROXY_HELPER = join(__dirname, 'Whistle');
// -x "
var enableProxy = (options) => {
  var bypass = options.bypass;
  var port = options.port;
  if (bypass) {
    bypass = ' -x "' + bypass + '"';
  } else {
    bypass = '';
  }
  return execSync('\'' + PROXY_HELPER + '\' -m global -p ' + port + ' -r ' + port + ' -s ' + options.host + bypass);
};

var disableProxy = () => execSync('\''  + PROXY_HELPER + '\' -m off');

exports.enableProxy = enableProxy;
exports.disableProxy = disableProxy;
