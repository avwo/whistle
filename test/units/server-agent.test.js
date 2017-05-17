var util = require('../util.test');

module.exports = function() {
  for (var i = 0; i < 221; i++) {
    util.request('https://' + i + '.server-agent.com/');
  }
};
