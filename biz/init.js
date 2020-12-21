var http = require('http');
var ui = require('./webui/lib');
var util = require('../lib/util');

module.exports = function init(proxy, callback) {
  var config = proxy.config;
  ui.init(proxy);
  if (config.customUIPort) {
    var server = http.createServer();
    ui.setupServer(server);
    util.getBoundIp(config.uihost, function(host) {
      if (host) {
        server.listen(config.uiport, host, callback);
      } else {
        server.listen(config.uiport, callback);
      }
    });
  } else {
    callback();
  }
};
