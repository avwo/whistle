var net = require('net');

var ver = process.version.substring(1).split('.');

if (ver[0] >= 7 && ver[1] >= 7) {
  var connect = net.Socket.prototype.connect;
  if (typeof connect === 'function') {
    //fix: v7.7.0+引入的 `"listener" argument must be a function` 问题
    net.Socket.prototype.connect = function(options, cb) {
      if (options && typeof options === 'object' && typeof cb !== 'function') {
        return connect.call(this, options, null);
      }
      return connect.apply(this, arguments);
    };
  }
}

function isPipeName(s) {
  return typeof s === 'string' && toNumber(s) === false;
}

function toNumber(x) {
  return (x = Number(x)) >= 0 ? x : false;
}

if (!net._normalizeConnectArgs) {
  //Returns an array [options] or [options, cb]
  //It is the same as the argument of Socket.prototype.connect().
  net._normalizeConnectArgs = function (args) {
    var options = {};

    if (args[0] !== null && typeof args[0] === 'object') {
      // connect(options, [cb])
      options = args[0];
    } else if (isPipeName(args[0])) {
      // connect(path, [cb]);
      options.path = args[0];
    } else {
      // connect(port, [host], [cb])
      options.port = args[0];
      if (typeof args[1] === 'string') {
        options.host = args[1];
      }
    }

    var cb = args[args.length - 1];
    return typeof cb === 'function' ? [options, cb] : [options];
  };
}

module.exports = function init(options, callback) {
	require('./lib/config').extend(options);
	return require('./lib')(callback);
};
