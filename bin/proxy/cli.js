var proxy = require('./index');

var OFF_RE = /^(?:o|0|-{0,2}off)$/i;
var HIS_RE = /^(?:-?l|-{0,2}list|-{0,2}history)$/i;
var HIS_IDX_RE = /^h\d+$/i;
var BYPASS_RE = /^(?:-{0,2}bypass|-x|-b)$/i;

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
  argv.forEach(function(arg, i) {
    // port
    if (arg >= 0) {
      opts.port = arg || opts.port;
    }
    // host:port host:0, auto

    // url

    // file

    // hx

    // bypass


  });
};
