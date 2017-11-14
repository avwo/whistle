var util = require('../lib/util');

module.exports = function init(proxy, callback) {
  var config = proxy.config;
  var count = 2;
  var execCallback = function() {
    if (--count === 0) {
      callback();
    }
  };
  util.getServer(function(server, port) {
    config.uiport = port;
    require(config.uipath)(server, proxy);
    execCallback();
  }, config.uiport);
  util.getServer(function(server, port) {
    config.weinreport = port;
    require('./weinre/app')(server);
    execCallback();
  }, config.weinreport);
};
