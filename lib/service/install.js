require('../util/patch');
var plugin = require('../../bin/plugin');

process.on('data', function(data) {
  if (data.type === 'installPlugins' && Array.isArray(data.argv)) {
    plugin.install('npm', data.argv, function(e) {
      data.clientId && process.sendData({
        type: 'error',
        clientId: data.clientId,
        data: (typeof e === 'string' ? e : e && e.message) || 'Install failed'
      });
    });
  }
});

module.exports = function(_, callback) {
  callback();
};
