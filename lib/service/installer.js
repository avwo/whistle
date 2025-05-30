
var cp = require('child_process');
var plugin = require('../../bin/plugin');

var CMD_SUFFIX = process.platform === 'win32' ? '.cmd' : '';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

function getVersion() {
  try {
    var result = cp.spawnSync('npm' + CMD_SUFFIX, ['-v'], plugin.formatCmdOpions({})).stdout;
    return result && result.toString().trim();
  } catch (e) {}
}

process.on('data', function (data) {
  if (!Array.isArray(data && data.pkgs)) {
    return;
  }
  var argv = data.pkgs.map(function(item) {
    return item.name + (item.version ? '@' + item.version : '');
  });
  if (data.whistleDir) {
    argv.push('--dir=' + data.whistleDir);
  }
  if (data.registry) {
    argv.push('--registry=' + data.registry);
  }
  plugin.install('npm', argv);
});

module.exports = function (_, callback) {
  var version = getVersion() || getVersion();
  callback(null, version);
};
