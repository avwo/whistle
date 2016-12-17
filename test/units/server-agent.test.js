var util = require('../util.test');

module.exports = function() {
  for (var i = 0; i < 520; i++) {
    util.request('https://' + i + '.server-agent.com/');
  }
};
