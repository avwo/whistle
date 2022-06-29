var net = require('net');
var proxy = require('set-global-proxy');
var util = require('./util');

var OFF_RE = /^(?:o|0|-{0,2}off)$/i;
var BYPASS_RE = /^(?:-{0,2}bypass|-x|-b)$/i;
var NUM_RE = /^\d+$/;
var HOST_SUFFIX_RE = /\:(\d+|auto)?$/;
var HOST_RE = /^[a-z\d_-]+(?:\.[a-z\d_-]+)*$/i;

function enableProxy(options) {
  try {
    if (proxy.enableProxy(options)) {
      util.info('Setting global proxy (' + options.host + ':' + options.port + ') successful.');
    } else {
      util.error('Failed to set global proxy (' + options.host + ':' + options.port + ').');
    }
  } catch (e) {
    util.error(e.message);
  }
}

function disableProxy() {
  try {
    if (proxy.disableProxy()) {
      util.info('Turn off global proxy successful.');
    } else {
      util.error('Failed to turn off global proxy.');
    }
  } catch (e) {
    util.error(e.message);
  }
}

module.exports = function(argv) {
  var cmd = argv[0];
  if (OFF_RE.test(cmd)) {
    return disableProxy();
  }
  var options = {};
  var skip;
  argv.forEach(function(arg) {
    if (skip) {
      options.bypass = arg;
      skip = false;
    } else if (BYPASS_RE.test(arg)) {
      skip = true;
    } else if (NUM_RE.test(arg)) {
      options.port = parseInt(arg, 10) || options.port;
    } else if (net.isIP(arg)) {
      options.host = arg || options.host;
    } else if (HOST_SUFFIX_RE.test(arg)) {
      var port = RegExp.$1;
      delete options.port;
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
    }
  });
  if (!options.port) {
    options.port = util.getDefaultPort();
  }
  options.host = options.host || '127.0.0.1';
  enableProxy(options);
};
