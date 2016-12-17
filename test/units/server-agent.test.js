var util = require('../util.test');

module.exports = function() {
  for (var i = 0; i < 321; i++) {
    util.request('https://' + i + '.server-agent.com/');
  }
};
