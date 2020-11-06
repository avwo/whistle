require('./lib/util/patch');
var net = require('net');
var tls = require('tls');

var ver = process.version.substring(1).split('.');
var PROD_RE = /(^|\|)prod(uction)?($|\|)/;

if (ver[0] >= 7 && ver[1] >= 7) {
  var connect = net.Socket.prototype.connect;
  if (typeof connect === 'function') {
    //fix: Node v7.7.0+引入的 `"listener" argument must be a function` 问题
    net.Socket.prototype.connect = function(options, cb) {
      if (options && typeof options === 'object' && typeof cb !== 'function') {
        return connect.call(this, options, null);
      }
      return connect.apply(this, arguments);
    };
  }
}

//see: https://github.com/joyent/node/issues/9272
var env = process.env || '';
env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (typeof tls.checkServerIdentity == 'function') {
  var checkServerIdentity = tls.checkServerIdentity;
  tls.checkServerIdentity = function() {
    try {
      return checkServerIdentity.apply(this, arguments);
    } catch(err) {
      return err;
    }
  };
}
if (env.WHISTLE_PLUGIN_EXEC_PATH) {
  env.PFORK_EXEC_PATH = env.WHISTLE_PLUGIN_EXEC_PATH;
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

module.exports = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (options && options.debugMode) {
    if (PROD_RE.test(options.mode)) {
      options.debugMode = false;
    } else {
      env.PFORK_MODE = 'bind';
    }
  }
  require('./lib/config').extend(options);
  return require('./lib')(callback);
};
