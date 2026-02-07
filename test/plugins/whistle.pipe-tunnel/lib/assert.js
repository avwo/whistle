var assert = require('assert');

module.exports = function(req) {
  req = req.originalReq;
  assert(req.pipeValue === 'test-tunnel*[optional]');
  assert(req.headers['user-agent'] !== 'test/whistle' || req.clientIp === '3.3.3.3');
  assert(req.globalPluginVars.join() === [ 'test1', 'test2', 'global=321' ].join());
  assert(req.pluginVars.join() === [ 'private=123' ].join());
};
