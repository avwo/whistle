var util = require('../lib/util');

module.exports = function init(proxy) {
  var config = proxy.config;
  require(config.uipath)(proxy);
  util.getServer(function(server, port) {
    config.weinreport = port;
    require('./weinre/app')(server);
  }, config.weinreport);
};
