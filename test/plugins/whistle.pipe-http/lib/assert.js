var assert = require('assert');

module.exports = function(req) {
  req = req.originalReq;
  assert(req.pipeValue === 'test-http+[optional]');
  assert(req.globalPluginVars.indexOf('global=http') !== -1);
  assert(req.pluginVars.indexOf('private=http') !== -1);
  assert(req.remoteAddress === '127.0.0.1' || req.remoteAddress === '6.6.6.6');
  assert(req.globalValue === 'test');
  if (req.fullUrl === 'http://header.test.weso.org/test/script/proxy?doNotParseJson') {
    assert(req.globalPluginVars.indexOf('header') !== -1 && req.pluginVars.indexOf('doNotParseJson') !== -1);
  }
};
