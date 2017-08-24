var util = require('../lib/util');
var config = require('../lib/config');
var properties = require('../lib/properties');

var index = 0;

exports.getClientId = function() {
  if (index > 999) {
    index = 0;
  }
  return Date.now() + index++;
};

exports.getServerInfo = function getServerInfo(req) {
  var info = {
    version: config.version,
    baseDir: config.baseDirHash,
    username: config.username,
    nodeVersion: process.version,
    latestVersion: properties.get('latestVersion'),
    host: util.hostname(),
    port: config.port,
    weinrePort: config.weinreport,
    ipv4: [],
    ipv6: [],
    mac: req.ip + (config.storage ? '\n' + config.storage : '')
  };
  var ifaces = util.networkInterfaces();
  Object.keys(ifaces).forEach(function(ifname) {
    ifaces[ifname].forEach(function (iface) {
      if (iface.internal) {
        return;
      }
      info[iface.family == 'IPv4' ? 'ipv4' : 'ipv6'].push(iface.address);
    });
  });

  return info;
};


