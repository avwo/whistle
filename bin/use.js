var path = require('path');
var http = require('http');
var url = require('url');
var fs = require('fs');
var util = require('./util');
var importModule = require('./import');
var pkg = require('../package.json');
var common = require('../lib/util/common');

var isRunning = util.isRunning;
var error = util.error;
var warn = util.warn;
var info = util.info;
var MAX_RULES_LEN = 1024 * 256;
var DEFAULT_OPTIONS = util.DEFAULT_OPTIONS;

function handleRules(options, filepath, callback) {
  if (typeof filepath === 'object') {
    return callback(filepath);
  }
  importModule(filepath, function(getRules) {
    if (typeof getRules !== 'function') {
      return callback(getRules);
    }
    var opts = {
      host: options.host,
      port: options.port,
      existsPlugin: existsPlugin
    };
    if (options && options.host) {
      opts.host = options.host;
    }
    getRules(callback, opts);
  });
}

function getString(str) {
  return typeof str !== 'string' ? '' : str.trim();
}

function existsPlugin(name, callback, pluginPaths) {
  if (typeof callback !== 'function') {
    callback = null;
    pluginPaths = null;
  }
  if (!name || typeof name !== 'string') {
    return callback ? callback(false) : false;
  }
  pluginPaths = pluginPaths || require('../lib/plugins/module-paths').getPaths().slice();
  var len = pluginPaths.length;
  if (len === 0) {
    return callback ? callback(false) : false;
  }
  if (callback) {
    var pkgFile = path.join(pluginPaths.shift(), name, 'package.json');
    common.getStat(pkgFile, function(err, stats) {
      if (err || !stats.isFile()) {
        return existsPlugin(name, callback, pluginPaths);
      }
      callback(true);
    });
    return;
  }
  for (var i = 0; i < len; i++) {
    var stats = common.getStatSync(path.join(pluginPaths[i], name, 'package.json'));
    if (stats && stats.isFile()) {
      return true;
    }
  }
  return false;
}

function getHost(options) {
  return util.joinIpPort(options.host || DEFAULT_OPTIONS.host, options.port);
}

function getReqOptions(options) {
  var reqOptions = url.parse('http://' + getHost(options) + '/cgi-bin/rules/project');
  reqOptions.headers = {
    'content-type': 'application/x-www-form-urlencoded'
  };
  if (options.specialAuth) {
    reqOptions.headers['x-whistle-special-auth'] = options.specialAuth;
  }
  reqOptions.method = 'POST';
  if (options.username || options.password) {
    var auth = [options.username || '', options.password || ''].join(':');
    reqOptions.headers.authorization = 'Basic ' + new Buffer.from(auth).toString('base64');
  }
  return reqOptions;
}

function request(reqOptions, body, cb) {
  var done;
  var handleCb = function(err, data) {
    if (done) {
      return;
    }
    done = true;
    if (err) {
      if (typeof err !== 'string') {
        err = err.message || String(err);
      }
      return cb(err);
    }
    cb(null, data);
  };
  var req = http.request(reqOptions, function(res) {
    util.getBody(res, handleCb);
  });
  req.on('error', handleCb);
  req.end(body);
}

function checkDefault(running, storage, isClient, callback) {
  if (running) {
    return callback();
  }
  if (isClient) {
    return callback(true);
  }
  var execCallback = function(err) {
    callback && callback(err);
    callback = null;
  };
  var req = http.get('http://' + getHost(DEFAULT_OPTIONS) + '/cgi-bin/status', function(res) {
    res.on('error', execCallback);
    util.getBody(res, function(err, data) {
      if (err || !data || data.name !== pkg.name || data.storage !== storage) {
        return execCallback(true);
      }
      callback(null, DEFAULT_OPTIONS.port);
    });
  });
  req.on('error', execCallback);
  req.end();
}

function handleClientConfig(text, callback) {
  text = text.split(',');
  if (text.length === 4) {
    return callback(null, {
      pid: text[0],
      options: {
        host: text[1],
        port: text[2],
        specialAuth: text[3]
      }
    });
  }
  callback(new Error('Invalid client config'));
}

function readConfig(storage, isClient, callback) {
  var configFile = isClient ? path.join(common.getHomedir(), '.whistle_client.pid') : util.getConfigFile(storage);
  fs.readFile(configFile, { encoding: 'utf8' }, function(err, text) {
    if (err) {
      return callback(err);
    }
    if (isClient) {
      return handleClientConfig(text || '', callback);
    }
    try {
      text = JSON.parse(text);
      if (text) {
        util.formatOptions(text.options);
        callback(null, text);
      } else {
        callback(new Error('Invalid config'));
      }
    } catch(e) {
      callback(e);
    }
  });
}

function removeSpecialAuth(config) {
  if (!config) {
    return config;
  }
  delete config.options.specialAuth;
  return config.options;
}

var getNoRunningError = function(storage, isClient) {
  if (isClient) {
    return new Error('No running Whistle client. Please install and start the latest Whistle client: https://github.com/avwo/whistle-client');
  }
  return new Error('No running Whistle instances. Execute `w2 start' + (storage ? ' -S ' + storage : '') + '` to start Whistle on the cli');
};

function getConfig(filepath, storage, force, isClient, cb) {
  var dir = '';
  var result;
  var callback;
  if (typeof storage === 'boolean') {
    var temp = force;
    force = storage;
    storage = temp;
  }
  if (typeof storage === 'function') {
    callback = storage;
    storage = '';
  }
  if (filepath && typeof filepath === 'object') {
    storage = storage || filepath.storage;
    isClient = isClient || filepath.isClient || filepath.client;
    force = force || filepath.force;
    if (common.isString(filepath.name) && common.isString(filepath.rules)) {
      result = filepath;
    }
    filepath = filepath.filepath;
  }
  if (isClient) {
    storage = '';
  } else {
    storage = storage || '';
    dir = encodeURIComponent(storage);
  }
  readConfig(dir, isClient, function(err, config) {
    if (err) {
      return cb(err.code === 'ENOENT' ? getNoRunningError(storage, isClient) : err);
    }
    !isClient && removeSpecialAuth(config);
    config.dir = dir;
    config.filepath = filepath;
    config.force = force;
    config.isClient = isClient;
    config.result = result;
    isRunning(config.options && config.pid, function(running) {
      checkDefault(running, config.dir, isClient, function(e, port) {
        if (e) {
          return cb(getNoRunningError(storage, isClient));
        }
        var options = config.options || {};
        if (port) {
          options = DEFAULT_OPTIONS;
        } else {
          options.host = options.host || DEFAULT_OPTIONS.host;
          options.port = options.port > 0 ? options.port : pkg.port;
        }
        config.options = options;
        cb(e, config, callback);
      });
    });
  });
}

module.exports = function(filepath, storage, force, isClient) {
  getConfig(filepath, storage, force, isClient, function(err, config, callback) {
    if (err) {
      return callback ? callback(err) : error(err.message);
    }
    var options = config.options;
    isClient = config.isClient;
    var handleError = function(msg) {
      if (callback) {
        callback(new Error(msg));
      } else {
        error(msg);
      }
    };
    var handleEnd = function(warning, name) {
      var warnTips = warning ? 'Warning: \'' + name + '\' already exists. Use \'--force\' to override' : null;
      if (callback) {
        callback(warnTips ? new Error(warnTips) : null, warning);
      } else if (warnTips) {
        info('Successfully enabled');
        warn(warnTips);
      } else {
        info('Successfully configured rules for Whistle' + (isClient ? ' client' : '') + ' (' + getHost(options) + ')');
      }
    };
    filepath = config.result || path.resolve(config.filepath || '.whistle.js');
    handleRules(options, filepath, function(result) {
      if (!result) {
        return handleError('The name and rules are required');
      }
      var name = getString(result.name);
      if (!name || name.length > 64) {
        return handleError('The name must be 1-64 characters');
      }
      var rules = getString(result.rules);
      if (rules.length > MAX_RULES_LEN) {
        return handleError('Maximum rules size: 256KB');
      }
      var groupName = getString(result.groupName) || getString(result.group);
      var reqOptions = getReqOptions(options);
      var setRules = function() {
        var body = [
          'name=' + encodeURIComponent(name),
          'rules=' + encodeURIComponent(rules),
          'groupName=' + encodeURIComponent(groupName.trim())
        ].join('&');
        request(reqOptions, body, function(em) {
          if (em) {
            return handleError(em);
          }
          handleEnd();
        });
      };
      if (config.force) {
        return setRules();
      }
      request(reqOptions, 'name=' + encodeURIComponent(name) + '&enable=1&top=1', function(em, data) {
        if (em) {
          return handleError(em);
        }
        if (data.rules) {
          return handleEnd(true, name);
        }
        setRules();
      });
    });
  });
};

module.exports.existsPlugin = existsPlugin;
module.exports.getOptions = function(cb, storage, isClient) {
  if (typeof cb !== 'function') {
    var temp = storage;
    storage = cb;
    cb = temp;
  }
  return getConfig(null, storage, null, isClient, function(err, config) {
    return cb(err, removeSpecialAuth(config));
  });
};
