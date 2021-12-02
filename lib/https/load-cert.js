var util = require('../util');
var rules = require('../rules');
var pluginMgr = require('../plugins');
var ca = require('./ca');

var remoteCerts = ca.remoteCerts;
var SNI_CALLBACK_RE = /^sniCallback:\/\/(?:whistle\.|plugin\.)?([a-z\d_\-]+)(?:\(([\s\S]*)\))?$/;
var certCallbacks = {};

module.exports = function(socket, callback) {
  var servername = socket.servername;
  var curCert = remoteCerts.get(servername);
  var plugin = rules.resolveSNICallback(socket);
  if (plugin) {
    if (socket.rules) {
      socket.rules.sniCallback = plugin;
    }
    if (SNI_CALLBACK_RE.test(plugin.matcher)) {
      socket.sniRuleValue = RegExp.$2;
      var pluginName = RegExp.$1;
      plugin = pluginMgr.getPlugin(pluginName + ':');
      if (plugin) {
        if (curCert && curCert.name) {
          socket.hasCertCache = curCert.name + (curCert.mtime ? '+' + curCert.mtime : '');
        }
        var cbKey = servername + '/' + pluginName;
        var cbList = certCallbacks[cbKey];
        var handleCert = function(cert) {
          if (cert === false) {
            return callback(false);
          }
          if (cert && util.isString(cert.key) && util.isString(cert.cert)) {
            socket.sniPlugin = cert.name;
            if (!curCert || curCert.key !== cert.key || curCert.cert !== cert.cert) {
              remoteCerts.set(servername, cert);
              curCert = cert;
            }
          } else {
            if (curCert) {
              if (cert) {
                socket.sniPlugin = curCert.name;
              } else {
                remoteCerts.del(servername);
                curCert = null;
              }
            }
          }
          callback(curCert);
        };
        if (cbList) {
          return cbList.push(handleCert);
        }
        certCallbacks[cbKey] = [handleCert];
        return pluginMgr.loadCert(socket, plugin, function(cert) {
          cbList = certCallbacks[cbKey];
          delete certCallbacks[cbKey];
          cbList && cbList.forEach(function(handleCb) {
            handleCb(cert);
          });
        });
      }
    }
  }
  curCert && remoteCerts.del(servername);
  callback();
};
