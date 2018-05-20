var util = require('util');
var path = require('path');
var ca = require('../https/ca');
var Storage = require('../rules/storage');
var getServer = require('hagent').create(null, 40500);

var loadModule = function(filepath) {
  try {
    return require(filepath);
  } catch (e) {}
};

module.exports = function(options, callback) {
  options.getRootCAFile = ca.getRootCAFile;
  options.createCertificate = ca.createCertificate;
  options.Storage = Storage;
  options.storage = new Storage(path.join(options.config.baseDir, '.plugins', options.name));
  if (options.debugMode) {
    var cacheLogs = [];
    /*eslint no-console: "off"*/
    console.log = function() {
      var msg = util.format.apply(this, arguments);
      if (cacheLogs) {
        cacheLogs.push(msg);
      } else {
        process.sendData({
          type: 'console.log',
          message: msg
        });
      }
    };
    process.on('data', function(data) {
      if (cacheLogs && data && data.type == 'console.log' && data.status == 'ready') {
        var _cacheLogs = cacheLogs;
        cacheLogs = null;
        _cacheLogs.forEach(function(msg) {
          process.sendData({
            type: 'console.log',
            message: msg
          });
        });
      }
    });
  }

  var port, statsPort, resStatsPort, uiPort, rulesPort, resRulesPort, tunnelRulesPort, tunnelPort;
  var count = 0;
  var callbackHandler = function() {
    if (--count <= 0) {
      callback(null, {
        port: port,
        statsPort: statsPort,
        resStatsPort: resStatsPort,
        uiPort: uiPort,
        rulesPort: rulesPort,
        resRulesPort: resRulesPort,
        tunnelRulesPort: tunnelRulesPort,
        tunnelPort: tunnelPort
      });
    }
  };

  try {
    require.resolve(options.value);
  } catch(e) {
    return callbackHandler();
  }
  var initial = loadModule(path.join(options.value, 'initial.js'));
  if (typeof initial === 'function') {
    initial(options);
  }
  var execPlugin = require(options.value);
  var startServer = execPlugin.pluginServer || execPlugin.server || execPlugin;
  if (typeof startServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startServer(server, options);
      port = _port;
      callbackHandler();
    });
  }

  var startStatsServer = execPlugin.statsServer || execPlugin.reqStatsServer;
  if (typeof startStatsServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startStatsServer(server, options);
      statsPort = _port;
      callbackHandler();
    });
  }

  var startResStatsServer = execPlugin.resStatsServer;
  if (typeof startResStatsServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startResStatsServer(server, options);
      resStatsPort = _port;
      callbackHandler();
    });
  }

  var startUIServer = execPlugin.uiServer || execPlugin.innerServer || execPlugin.internalServer;
  if (typeof startUIServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startUIServer(server, options);
      uiPort = _port;
      callbackHandler();
    });
  }

  var startRulesServer = execPlugin.pluginRulesServer || execPlugin.rulesServer || execPlugin.reqRulesServer;
  if (typeof startRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startRulesServer(server, options);
      rulesPort = _port;
      callbackHandler();
    });
  }

  var startResRulesServer = execPlugin.resRulesServer;
  if (typeof startResRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startResRulesServer(server, options);
      resRulesPort = _port;
      callbackHandler();
    });
  }

  var startTunnelRulesServer = execPlugin.pluginRulesServer || execPlugin.tunnelRulesServer;
  if (typeof startTunnelRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startTunnelRulesServer(server, options);
      tunnelRulesPort = _port;
      callbackHandler();
    });
  }

  var startTunnelServer = execPlugin.pluginServer || execPlugin.tunnelServer || execPlugin.connectServer;
  if (typeof startTunnelServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startTunnelServer(server, options);
      tunnelPort = _port;
      callbackHandler();
    });
  }

  if (!count) {
    callbackHandler();
  }
};


