var http = require('http');
var ui = require('./webui/lib');

var LOCALHOST = '127.0.0.1';

module.exports = function init(proxy, callback) {
  var config = proxy.config;
  ui.init(proxy);
  if (config.customUIPort) {
    var server = http.createServer();
    ui.setupServer(server);
    if (config.host === LOCALHOST) {
      server.listen(config.uiport, LOCALHOST, callback);
    } else {
      server.listen(config.uiport, callback);
    }
  } else {
    callback();
  }
};
