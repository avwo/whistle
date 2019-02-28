var http = require('http');
var util = require('../lib/util');
var ui = require('./webui/lib');

var LOCALHOST = '127.0.0.1';

module.exports = function init(proxy, callback) {
  var config = proxy.config;
  var count = 2;
  var execCallback = function() {
    if (--count === 0) {
      callback();
    }
  };
  ui.init(proxy);
  if (config.customUIPort) {
    var server = http.createServer();
    ui.setupServer(server);
    if (config.host === LOCALHOST) {
      server.listen(config.uiport, LOCALHOST, execCallback);
    } else {
      server.listen(config.uiport, execCallback);
    }
  } else {
    execCallback();
  }
  util.getServer(function(server, port) {
    config.weinreport = port;
    require('./weinre')(server);
    execCallback();
  });
};
