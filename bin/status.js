var Q = require('q');
var util = require('./util');
var pkg = require('../package.json');

var isRunning = util.isRunning;
var showUsage = util.showUsage;
var readConfig = util.readConfig;
var readConfigList = util.readConfigList;
var error = util.error;
var info = util.info;

function showAll() {
  var list = readConfigList().map(function(config) {
    var deferred = Q.defer();
    isRunning(config.pid, function(running) {
      deferred.resolve(running && config);
    });
    return deferred.promise;
  });
  Q.all(list).then(function(confList) {
    confList = confList.filter(function(conf) {
      return conf;
    });
    var len = confList.length;
    if (!len) {
      error('No running whistle.');
    } else {
      var tips = ['All running whistle:'];
      confList.forEach(function(conf, i) {
        ++i;
        var options = conf.options;
        tips.push('  ' + i + '. port: ' + (options.port || pkg.port)
          + (options.storage ? ', storage: ' + options.storage : ''));
      });
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