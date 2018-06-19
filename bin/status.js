var util = require('./util');

var isRunning = util.isRunning;
var showUsage = util.showUsage;
var error = util.error;
var info = util.info;

function showAll() {
  var tips = [];
  // All running whistle:
  // 1. port: 8899
  // 2. port: 888, storage: xxx

  if (tips.length) {
    info(tips.join('\n'));
  } else {
    error('No running whistle.');
  }
}

module.exports = function(all, storage) {
  if (all) {
    return showAll();
  }
  showUsage(true, { port: 8899 });
};