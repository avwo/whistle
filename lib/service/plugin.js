var fork = require('pfork').fork;
var path = require('path');

var debugMode;
var script = path.join(__dirname, 'installer.js');

function loadInstaller(callback) {
  fork(
    {
      script: script,
      debugMode: debugMode
    },
    callback
  );
}


module.exports = function(config) {
  debugMode = config.debugMode;
  loadInstaller(function(_, version, proc) {
    if (!version) {
      return proc && proc.kill();
    }
    config.epm = true;
    config.installPlugins = function(data) {
      loadInstaller(function(_, __, child) {
        child && child.sendData(data);
      });
    };
  });
};
