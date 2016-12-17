var util = require('../util.test');

module.exports = function() {
  for (var i = 0; i < 600; i++) {
    util.request('https://' + i + '.server-agent.com/');
  }
};
