var getServer = require('hagent').getServer;
var startWeinre = require('weinre2').run;

module.exports = function (_, callback) {
  getServer(function (server, port) {
    startWeinre({
      server: server,
      verbose: false,
      debug: false,
      readTimeout: 5,
      deathTimeout: 15
    });
    callback(null, { port: port });
  });
};


