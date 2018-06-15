var path = require('path');
var os = require('os');
var util = require('util');
var cp = require('child_process');
var fs = require('fs');
var colors = require('colors/safe');
var fse = require('fs-extra2');
var http = require('http');
var url = require('url');
var pkg = require('../package.json');
var getPluginPaths = require('../lib/plugins/module-paths').getPaths;

/*eslint no-console: "off"*/
var pluginPaths = getPluginPaths();
var MAX_RULES_LEN = 1024 * 16;
var CHECK_RUNNING_CMD = process.platform === 'win32' ? 
  'tasklist /fi "PID eq %s" | findstr /i "node.exe"'
  : 'ps -f -p %s | grep "node"';
var options;

function getHomedir() {
  //默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
    process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

function isRunning(pid, callback) {
  pid ? cp.exec(util.format(CHECK_RUNNING_CMD, pid), 
    function (err, stdout, stderr) {
      callback(!err && !!stdout.toString().trim());
    }) : callback(false);
}

function showStartWhistleTips(storage) {
  console.log(colors.red('Please execute `w2 start' + (storage ? ' -S ' + storage : '')
    + '` to start whistle first.'));
}

function handleRules(filepath, callback, port) {
  var getRules = require(filepath);
  if (typeof getRules !== 'function') {
    return callback(getRules);
  }
  getRules(callback, {
    port: port,
    existsPlugin: existsPlugin
  });
}

function getString(str) {
  return typeof str !== 'string' ? '' : str.trim();
}

function existsPlugin(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  for (var i = 0, len = pluginPaths.length; i < len; i++) {
    try {
      if (fs.statSync(path.join(pluginPaths[i], name)).isDirectory()) {
        return true;
      }
    } catch(e) {}
  }
  return false;
}

var reqOptions;
function request(body, callback) {
  if (!reqOptions) {
    reqOptions = url.parse('http://127.0.0.1:' + options.port + '/cgi-bin/rules/project');
    reqOptions.method = 'POST';
    if (options.username || options.password) {
      var auth = [options.username || '', options.password || ''].join(':');
      reqOptions.headers = {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: 'Basic ' + new Buffer(auth).toString('base64')
      };
    }
  }
  var req = http.request(reqOptions, function(res) {
    res.setEncoding('utf8');
    var resBody = '';
    res.on('data', function(data) {
      resBody += data;
    });
    res.on('end', function() {
      if (res.statusCode != 200) {
        throw resBody || 'response ' + res.statusCode + ' error';
      }
      callback(JSON.parse(resBody));
    });
  });
  // 不处理错误，直接抛出终止进程
  req.end(body);
}

module.exports = function(filepath, storage, force) {
  var dataDir = path.resolve(getHomedir(), '.startingAppData');
  var configFile = path.join(dataDir, encodeURIComponent('#' + (storage ? storage + '#' : '')));
  if (!fs.existsSync(configFile)) {
    return showStartWhistleTips(storage);
  }
  var pid;
  try {
    var config = fse.readJsonSync(configFile);
    options = config.options; 
    pid = options && config.pid;
  } catch(e) {}
  isRunning(pid, function(running) {
    if (!running) {
      return showStartWhistleTips(storage);
    }
    filepath = path.resolve(filepath || '.whistle.js');
    var port = options.port = options.port > 0 ? options.port : pkg.port;
    handleRules(filepath, function(result) {
      if (!result) {
        console.log(colors.red('The name and rules cannot be empty.'));
        return;
      }
      var name = getString(result.name);
      if (!name || name.length > 64) {
        console.log(colors.red('The name cannot be empty and the length cannot exceed 64 characters.'));
        return;
      }
      var rules = getString(result.rules);
      if (rules.length > MAX_RULES_LEN) {
        console.log(colors.red('The rules cannot be empty and the size cannot exceed 16k.'));
        return;
      }
      var setRules = function() {
        var body = [
          'name=' + encodeURIComponent(name),
          'rules=' + encodeURIComponent(rules)
        ].join('&');
        request(body, function() {
          console.log(colors.green('Setting whistle[127.0.0.1:' + port + '] rules successful.'));
        });
      };
      if (force) {
        return setRules();
      }
      request('name=' + encodeURIComponent(name), function(data) {
        if (data.rules) {
          console.log(colors.yellow('The rule already exists, to override it, add CLI option --force.'));
          return;
        }
        setRules();
      });
    }, port);
  });
};