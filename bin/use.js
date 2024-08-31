var path = require('path');
var fs = require('fs');
var http = require('http');
var url = require('url');
var Buffer = require('safe-buffer').Buffer;
var util = require('./util');
var importModule = require('./import');
var pkg = require('../package.json');
var getHomedir = require('../lib/util/common').getHomedir;

var isRunning = util.isRunning;
var error = util.error;
var warn = util.warn;
var info = util.info;
var readConfig = util.readConfig;
var MAX_RULES_LEN = 1024 * 256;
var DEFAULT_OPTIONS = { host: '127.0.0.1', port: 8899 };
var options;

function showStartWhistleTips(storage, isClient) {
  if (isClient) {
    error('No running whistle client, please install and start the latest whistle client: https://github.com/avwo/whistle-client');
  } else {
    error('No running whistle, execute `w2 start' + (storage ? ' -S ' + storage : '') + '` to start whistle on the cli.');
  }
}

function handleRules(filepath, callback, port) {
  importModule(filepath, function(getRules) {
    if (typeof getRules !== 'function') {
      return callback(getRules);
    }
    var opts = {
      port: port,
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

function existsPlugin(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  var pluginPaths = require('../lib/plugins/module-paths').getPaths();
  for (var i = 0, len = pluginPaths.length; i < len; i++) {
    try {
      if (fs.statSync(path.join(pluginPaths[i], name)).isDirectory()) {
        return true;
      }
    } catch(e) {}
  }
  return false;
}

function getBody(res, callback) {
  var resBody = '';
  res.setEncoding('utf8');
  res.on('data', function(data) {
    resBody += data;
  });
  res.on('end', function() {
    if (res.statusCode != 200) {
      callback(resBody || 'response ' + res.statusCode + ' error');
    } else {
      callback(null, JSON.parse(resBody));
    }
  });
}

var reqOptions;
function request(body, callback) {
  if (!reqOptions) {
    reqOptions = url.parse('http://' + util.joinIpPort(options.host || '127.0.0.1', options.port) + '/cgi-bin/rules/project');
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
  }
  var req = http.request(reqOptions, function(res) {
    getBody(res, function(err, data) {
      if (err) {
        throw err;
      }
      callback(data);
    });
  });
  // 不处理错误，直接抛出终止进程
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
  var req = http.get('http://' + DEFAULT_OPTIONS.host + ':' + DEFAULT_OPTIONS.port + '/cgi-bin/status', function(res) {
    res.on('error', execCallback);
    getBody(res, function(err, data) {
      if (err || !data || data.name !== pkg.name || data.storage !== storage) {
        return execCallback(true);
      }
      callback(null, DEFAULT_OPTIONS.port);
    });
  });
  req.on('error', execCallback);
  req.end();
}

function readClientConfig() {
  var procPath = path.join(getHomedir(), '.whistle_client.pid');
  try {
    var info = fs.readFileSync(procPath, { encoding: 'utf-8' }).split(',');
    if (info.length === 4) {
      return {
        pid: info[0],
        options: {
          host: info[1],
          port: info[2],
          specialAuth: info[3]
        }
      };
    }
  } catch (e) {}
}

module.exports = function(filepath, storage, force, isClient) {
  var config;
  var dir = '';
  if (isClient) {
    storage = '';
    config = readClientConfig() || '';
  } else {
    storage = storage || '';
    dir = encodeURIComponent(storage);
    config = readConfig(dir) || '';
    if (config.options) {
      delete config.options.specialAuth;
    }
  }
  options = config.options || '';
  isRunning(options && config.pid, function(running) {
    checkDefault(running, dir, isClient, function(err, port) {
      if (err) {
        return showStartWhistleTips(storage, isClient);
      }
      filepath = path.resolve(filepath || '.whistle.js');
      if (port) {
        options = DEFAULT_OPTIONS;
      } else {
        port = options.port = options.port > 0 ? options.port : pkg.port;
      }
      handleRules(filepath, function(result) {
        if (!result) {
          error('The name and rules cannot be empty.');
          return;
        }
        var name = getString(result.name);
        if (!name || name.length > 64) {
          error('The name cannot be empty and the length cannot exceed 64 characters.');
          return;
        }
        var rules = getString(result.rules);
        if (rules.length > MAX_RULES_LEN) {
          error('The rules cannot be empty and the size cannot exceed 256k.');
          return;
        }
        var groupName = getString(result.groupName) || getString(result.group);
        var setRules = function() {
          var body = [
            'name=' + encodeURIComponent(name),
            'rules=' + encodeURIComponent(rules),
            'groupName=' + encodeURIComponent(groupName.trim())
          ].join('&');
          request(body, function() {
            info('Setting whistle' + (isClient ? ' client' : '') + ' (' + util.joinIpPort(options.host || '127.0.0.1', port) + ') rules successful.');
          });
        };
        if (force) {
          return setRules();
        }
        request('name=' + encodeURIComponent(name) + '&enable=1&top=1', function(data) {
          if (data.rules) {
            info('Successfully enabled.');
            warn('Warning: The rule already exists, to override the content, add CLI option --force.');
            return;
          }
          setRules();
        });
      }, port);
    });
  });
};