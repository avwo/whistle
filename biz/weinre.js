var startWeinre = require('weinre2').run;

module.exports = startWeinre({
  verbose: false,
  debug: false,
  readTimeout: 5,
  deathTimeout: 15
});
