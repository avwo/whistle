var util = require('./util');
var pkg = require('../package.json');
var colors = require('colors/safe');
var isRunning = util.isRunning;
var showUsage = util.showUsage;
var readConfig = util.readConfig;
var readConfigList = util.readConfigList;
var warn = util.warn;
var info = util.info;

function showAll(byStop) {
  var list = readConfigList().map(function(config) {
    return new Promise(function(resolve) {
      isRunning(config.pid, function(running) {
        resolve(running && config);
      });
    });
  });
  Promise.all(list).then(function(confList) {
    confList = confList.filter(function(conf) {
      return conf;
    });
    var len = confList.length;
    if (!len) {
      warn('[!] No running Whistle instances');
    } else {
      var tips = ['[i] All running Whistle instances:'];
      confList.forEach(function(conf, i) {
        ++i;
        var options = conf.options;
        tips.push('  ' + i + '.' + (conf.pid ? ' PID: ' + conf.pid + ',' : '')
          + ' Port: ' + (options.port || pkg.port)
          + (options.host ? ', Host: ' + options.host : '')
          + (options.storage ? ', Storage: ' + options.storage : '')
          + (byStop ? colors.red(' (Stop cmd: ' + (options.storage ? 'w2 stop -S ' + options.storage : 'w2 stop') + ')') : ''));
      });
      byStop && warn('[!] This Whistle instance is not running');
      info(tips.join('\n'));
    }
  });

  // All running whistle:
  // 1. port: 8899
  // 2. port: 888, storage: xxx
}

module.exports = function(all, storage) {
  if (!all) {
    var config = readConfig(storage) || '';
    var pid = config.pid;
    var options = pid && config.options;
    if (pid) {
      isRunning(pid, function(running) {
        if (running) {
          return showUsage(true, options);
        }
        showAll();
      });
      return;
    }
  }
  showAll();
};

module.exports.showAll = showAll;
