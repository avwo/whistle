var startWeinre = require('weinre2').run;

module.exports = function init(server) {
  startWeinre({
    server: server,
    verbose: false,
    debug: false,
    readTimeout: 6,
    deathTimeout: 20
  });
};
