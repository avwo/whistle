var assert = require('assert');

module.exports = function(req) {
  req = req.originalReq;
  assert(req.pipeValue === 'test-ws&[optional]');
  assert(req.globalPluginVars.indexOf('global=ws') !== -1);
  assert(req.pluginVars.indexOf('private=ws') !== -1);
  assert(req.remoteAddress === '127.0.0.1' || req.remoteAddress === '6.6.6.6');
};
