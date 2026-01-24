var fs = require('fs');
var path = require('path');
var util = require('../util');
var config = require('../config');
var protocols = require('../rules/protocols');
var common = require('../util/common');

var ORG_RE = /^@[\w.~-]+$/;
var WHISLTE_PLUGIN_RE = /^whistle\.[a-z\d_\-]+$/;
var PLUGIN_NAME_RE = /^(?:@[\w.~-]+\/)?(whistle\.[a-z\d_\-]+)$/;
var DEV_PLUGINS_PATH = config.DEV_PLUGINS_PATH;
var MAX_EXPIRE = 36000;
var UTF8_OPTIONS = { encoding: 'utf8' };
var workerScript = util.readFileSync(path.join(__dirname, '../../assets/js/worker.js'), false);
var workers = {};

function replaceScript(ctn, name) {
  return workerScript.replace('$PLUGIN_NAME', name).replace('/*sourcecode*/', ctn);
}

exports.readWorkerSync = function(root, conf, name) {
  var file = util.getWebWorker(conf);
  file = file && util.readFileSync(path.join(root, file));
  if (!file) {
    return;
  }
  var id = util.createHash(file);
  workers[id] = replaceScript(file, name);
  return id;
};

exports.readWorker = function(root, conf, callback, name) {
  var file = util.getWebWorker(conf);
  if (!file) {
    return callback();
  }
  readFile(path.join(root, file), function(err, ctn) {
    if (err || !ctn) {
      return callback();
    }
    var id = util.createHash(ctn);
    workers[id] = replaceScript(ctn, name);
    callback(id);
  });
};

exports.getWorker = function(id) {
  return workers[id];
};

exports.resetWorkers = function(plugins) {
  var _workers = {};
  Object.keys(plugins).forEach(function(key) {
    var plugin = plugins[key];
    _workers[plugin.webWorker] = workers[plugin.webWorker];
  });
  workers = _workers;
};

function isOrgModule(name) {
  return ORG_RE.test(name);
}

exports.isOrgModule = isOrgModule;

exports.isPluginName = function(name) {
  return PLUGIN_NAME_RE.test(name);
};

function getPluginName(name) {
  return name.substring(name.lastIndexOf('.') + 1);
}

exports.getPluginName = getPluginName;

function isWhistleModule(name) {
  return WHISLTE_PLUGIN_RE.test(name);
}

exports.isWhistleModule = isWhistleModule;

function getHomePageFromPackage(pkg) {
  if (util.isUrl(pkg.homepage)) {
    return pkg.homepage;
  }

  return extractUrl(pkg.repository) || '';
}

function extractUrl(repository) {
  if (
    !repository ||
    repository.type != 'git' ||
    typeof repository.url != 'string'
  ) {
    return;
  }

  var url = repository.url.replace(/^git\+/i, '');
  if (!util.isUrl(url)) {
    url = url.replace(/^git@([^:]+):/, 'http://$1/');
  }

  return url.replace(/\.git\s*$/i, '');
}

exports.getHomePageFromPackage = getHomePageFromPackage;

exports.parseValues = function (val, name) {
  if (val) {
    val = util.parseJSON(val);
  }
  if (!val) {
    return '';
  }
  var result = {};
  name = util.getPluginFile(name);
  Object.keys(val).forEach(function (key) {
    result[util.getInlineKey(key, name)] = util.toString(val[key]);
  });
  return result;
};

exports.getPluginHomepage = function (pkg) {
  var url = pkg.pluginHomepage || pkg.pluginHomePage;
  return typeof url === 'string' ? url : undefined;
};

exports.excludePlugin = function (name) {
  if (
    protocols.contains(name) ||
    (config.allowPluginList && config.allowPluginList.indexOf(name) === -1)
  ) {
    return true;
  }
  return config.blockPluginList && config.blockPluginList.indexOf(name) !== -1;
};

function setPlugin(plugins, pkg, root, mtime, sync) {
  if (PLUGIN_NAME_RE.test(pkg.name)) {
    var name = sync ? RegExp.$1 : getPluginName(RegExp.$1);
    plugins[name] = {
      root: root,
      mtime: mtime,
      notUn: true,
      isProj: true,
      isDev: true
    };
  }
}

exports.readDevPluginsSync = function() {
  var plugins = {};
  try {
    var files = fs.readdirSync(DEV_PLUGINS_PATH);
    files.forEach(function(file) {
      file = path.join(DEV_PLUGINS_PATH, file);
      try {
        var ctn = fs.readFileSync(file, UTF8_OPTIONS).split('\n');
        if (Date.now() - ctn[0] < MAX_EXPIRE && ctn[1]) {
          var root = ctn[1];
          var pkgPath = path.join(root, 'package.json');
          var stats = common.getStatSync(pkgPath);
          var pkg = common.readJsonSync(pkgPath);
          setPlugin(plugins, pkg, root, stats.mtime.getTime(), true);
        } else {
          fs.unlinkSync(file);
        }
      } catch (e) {}
    });
  } catch (e) {}
  return plugins;
};

function readFile(filepath, callback) {
  fs.readFile(filepath, UTF8_OPTIONS, function (err, text) {
    if (!err) {
      return callback(err, text);
    }
    fs.readFile(filepath, UTF8_OPTIONS, callback);
  });
}

function readDir(dir, callback) {
  fs.readdir(dir, function (err, list) {
    if (!err) {
      return callback(err, list);
    }
    if (err.code !== 'ENOENT') {
      return callback(err);
    }
    fs.readdir(dir, callback);
  });
}

exports.readFile = readFile;
exports.readDir = readDir;

exports.readDevPlugins = function(callback) {
  var plugins = {};
  readDir(DEV_PLUGINS_PATH, function(err, files) {
    var len = files && files.length;
    if (!len) {
      return callback(plugins);
    }
    files.forEach(function(file) {
      file = path.join(DEV_PLUGINS_PATH, file);
      readFile(file, function(_, ctn) {
        ctn = ctn && ctn.split('\n');
        if (ctn && Date.now() - ctn[0] < MAX_EXPIRE && ctn[1]) {
          var root = ctn[1];
          var pkgPath = path.join(root, 'package.json');
          readFile(pkgPath, function(_, pkg) {
            if (pkg) {
              try {
                pkg = JSON.parse(pkg);
                return common.getStat(pkgPath, function(_, stats) {
                  stats && stats.isFile() && setPlugin(plugins, pkg, root, stats.mtime.getTime());
                  --len === 0 && callback(plugins);
                });
              } catch (e) {}
            }
            --len === 0 && callback(plugins);
          });
        } else {
          fs.unlink(file, util.noop);
          --len === 0 && callback(plugins);
        }
      });
    });
  });
};

function fsExistsSync(filepath, retry) {
  try {
    return fs.existsSync(filepath);
  } catch (e) {}
  return !retry && fsExistsSync(filepath, true);
}

exports.getSysPathSync = function(dir, name, org) {
  var root = org ? path.join(dir, name, 'node_modules', org, name) : path.join(dir, name, 'node_modules', name);
  if (fsExistsSync(root)) {
    return root;
  }
  return path.join(dir, name);
};

exports.getSysPath = function(dir, name, isSys, cb) {
  var root = path.join(dir, name);
  if (!isSys) {
    return cb(root);
  }
  var sysRoot = path.join(root, 'node_modules', name);
  common.getStat(sysRoot, function(_, exists) {
    cb(exists ? sysRoot : root);
  });
};
