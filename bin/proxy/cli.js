var net = require('net');
var proxy = require('./index');

var OFF_RE = /^(?:o|0|-{0,2}off)$/i;
var HIS_RE = /^(?:-?l|-{0,2}list|-{0,2}history)$/i;
var HIS_IDX_RE = /^h\d+$/i;
var BYPASS_RE = /^(?:-{0,2}bypass|-x|-b)$/i;
var NUM_RE = /^\d+$/;
var HOST_SUFFIX_RE = /\:(\d+|auto)?$/;
var HOST_RE = /^[a-z\d_-]+(?:\.[a-z\d_-]+)*$/i;

function disableProxy() {

}

function getDefaultPort() {

}

function enableProxy(options) {

}

function showHistory() {

}

module.exports = function(argv) {
  var cmd = argv[0];
  if (OFF_RE.test(cmd)) {
    return disableProxy();
  }
  if (HIS_RE.test(cmd)) {
    return showHistory();
  }
  var opts = {};
  var skip;
  argv.forEach(function(arg) {
    if (skip) {
      opts.bypass = arg;
      skip = false;
    } else if (BYPASS_RE.test(arg)) {
      skip = true;
    } else if (NUM_RE.test(arg)) {
      opts.port = parseInt(arg, 10) || opts.port;
    } else if (net.isIP(arg)) {
      opts.host = arg || opts.host;
    } else if (HOST_SUFFIX_RE.test(arg)) {
      var port = RegExp.$1;
      delete opts.port;
      if (port > 0) {
        opts.port = parseInt(port, 10) || opts.port;
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
        opts.host = host || opts.host;
      }
    } else if (HIS_IDX_RE.test(arg)) {
      opts.id = arg;
    }
  });
};
