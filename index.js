require('./lib/util/patch');
var net = require('net');
var tls = require('tls');
var extend = require('extend');
var path = require('path');
var cluster = require('cluster');
var os = require('os');
var assert = require('assert');
var common = require('./lib/util/common');

var ver = process.version.substring(1).split('.');
var PROD_RE = /(^|\|)prod(uction)?($|\|)/;
var noop = function () {};
var state = {};
var INTERVAL = 1000;
var TIMEOUT = 10000;
var MASTER_TIMEOUT = 12000;

if (ver[0] >= 7 && ver[1] >= 7) {
  var connect = net.Socket.prototype.connect;
  if (typeof connect === 'function') {
    //fix: Node v7.7.0+引入的 `"listener" argument must be a function` 问题
    net.Socket.prototype.connect = function (options, cb) {
      if (options && typeof options === 'object' && typeof cb !== 'function') {
        return connect.call(this, options, null);
      }
      return connect.apply(this, arguments);
    };
  }
}

var env = process.env || '';
env.WHISTLE_ROOT = __dirname;
if (typeof tls.checkServerIdentity == 'function') {
  var checkServerIdentity = tls.checkServerIdentity;
  tls.checkServerIdentity = function () {
    try {
      return checkServerIdentity.apply(this, arguments);
    } catch (err) {
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

function loadConfig(options) {
  var config = options.config;
  if (config) {
    delete options.config;
    return require(path.resolve(config));
  }
}

function likePromise(p) {
  return p && typeof p.then === 'function' && typeof p.catch === 'function';
}

function killWorker(worker) {
  try {
    worker.removeAllListeners();
    worker.on('error', noop);
    worker.kill('SIGTERM');
  } catch (err) {}
}

function forkWorker(index) {
  var worker = cluster.fork({ workerIndex: index });
  var reforked;
  var refork = () => {
    if (!state[index]) {
      setTimeout(function () {
        process.exit(1);
      }, INTERVAL);
      return;
    }
    if (reforked) {
      return;
    }
    reforked = true;
    killWorker(worker);
    clearInterval(worker.timer);
    clearTimeout(worker.activeTimer);
    setTimeout(function () {
      forkWorker(index);
    }, 600);
  };
  worker.once('disconnect', refork);
  worker.once('exit', refork);
  worker.on('error', noop);
  worker.on('message', (msg) => {
    if (msg !== '1') {
      return;
    }
    state[index] = true;
    if (!worker.timer) {
      worker.timer = setInterval(() => {
        try {
          worker.send('1', noop);
        } catch (e) {
          clearInterval(worker.timer);
        }
      }, INTERVAL);
    } else {
      clearTimeout(worker.activeTimer);
    }
    worker.activeTimer = setTimeout(refork, MASTER_TIMEOUT);
  });
}

module.exports = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  var startWhistle = function () {
    var server = options.server;
    if (server) {
      assert(options.port > 0, 'options.port of the custom server is required');
      if (!options.storage && options.storage !== false) {
        options.storage = '__custom_server_5b6af7b9884e1165__' + options.port;
      }
    }
    var workerIndex = env.workerIndex;
    if (options && options.cluster && workerIndex >= 0) {
      options.storage =
        '.' +
        (options.storage || '') +
        '__cluster_worker.' +
        workerIndex +
        '_5b6af7b9884e1165__';
    }
    var conf = require('./lib/config').extend(options);
    if (!conf.cluster) {
      return require('./lib')(callback, server);
    }
    var timer;
    var activeTimeout = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        process.exit(1);
      }, TIMEOUT);
    };
    process.once('SIGTERM', function () {
      process.exit(0);
    });

    require('./lib')(function () {
      activeTimeout();
      process.on('message', activeTimeout);
      process.send('1', noop);
      setInterval(() => {
        try {
          process.send('1', noop);
        } catch (e) {}
      }, INTERVAL);
    });
  };
  if (options) {
    if (/^\d+$/.test(options.cluster)) {
      options.cluster = Math.min(parseInt(options.cluster, 10), 999);
    } else if (options.cluster) {
      options.cluster = Math.min(os.cpus().length, 999);
    }
    if (options.cluster && cluster.isMaster) {
      assert(!options.server, 'cannot exist options.server in cluster mode');
      for (var i = 0; i < options.cluster; i++) {
        forkWorker(i);
      }
      return;
    }
    if (options.debugMode) {
      if (PROD_RE.test(options.mode)) {
        options.debugMode = false;
      } else {
        env.PFORK_MODE = 'bind';
      }
    }
    var config = loadConfig(options);
    if (typeof config === 'function') {
      var handleCallback = function (opts) {
        opts && extend(options, opts);
        return startWhistle();
      };
      if (config.length < 2) {
        config = config(options);
        if (likePromise(config)) {
          return config.then(handleCallback).catch(function (err) {
            process.nextTick(function () {
              throw err;
            });
          });
        }
      } else {
        config(options, handleCallback);
      }
    }
    config && extend(options, config);
  }
  return startWhistle();
};

module.exports.getWhistlePath = common.getWhistlePath;
