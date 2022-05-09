var net = require('net');
var installRootCA = require('./index');
var util = require('../util');

var NUM_RE = /^\d+$/;
var HOST_SUFFIX_RE = /\:(\d+|auto)?$/;
var HOST_RE = /^[a-z\d_-]+(?:\.[a-z\d_-]+)*$/i;
var URL_RE = /^https?:\/\/./i;

function getCAFilePath(url) {

}

function install(options) {
  installRootCA(getCAFilePath());
}

module.exports = function(argv) {
  var options = {};
  argv.forEach(function(arg) {
    if (NUM_RE.test(arg)) {
      delete options.addr;
      options.port = parseInt(arg, 10) || options.port;
    } else if (net.isIP(arg)) {
      delete options.addr;
      options.host = arg || options.host;
    } else if (HOST_SUFFIX_RE.test(arg)) {
      delete options.port;
      delete options.addr;
      var port = RegExp.$1;
      if (port > 0) {
        options.port = parseInt(port, 10) || options.port;
      }
      var host = arg.slice(0, - port.length - 1);
      if (host[0] === '[') {
        host = host.substring(1);
      }
      var lastIndex = host.length - 1;
      if (host[lastIndex] === ']') {
        host = host.substring(0, lastIndex);
      }
      if (host && (net.isIP(host) || HOST_RE.test(host))) {
        options.host = host || options.host;
      }
    } else {
      delete options.port;
      delete options.host;
      if (URL_RE.test(arg)) {
        options.addr = { url: arg };
      } else {
        options.addr = { file: arg };
      }
    }
  });
  if (!options.addr) {
    if (!options.port) {
      options.port = util.getDefaultPort();
    }
    options.host = options.host || '127.0.0.1';
  }
  install(options);
};
