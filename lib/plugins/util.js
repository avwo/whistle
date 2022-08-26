var fs = require('fs');
var fse = require('fs-extra2');
var path = require('path');
var util = require('../util');
var config = require('../config');
var protocols = require('../rules/protocols');

var ORG_RE = /^@[\w-]+$/;
var WHISLTE_PLUGIN_RE = /^whistle\.[a-z\d_\-]+$/;
var HTTP_RE = /^https?:\/\//i;
var PLUGIN_NAME_RE = /^(?:@[\w-]+\/)?(whistle\.[a-z\d_\-]+)$/;
var DEV_PLUGINS_PATH = config.DEV_PLUGINS_PATH;
var MAX_EXPIRE = 36000;
var UTF8_OPTIONS = { encoding: 'utf8' };

function isOrgModule(name) {
  return ORG_RE.test(name);
}

exports.isOrgModule = isOrgModule;

exports.isPluginName = function(name) {
  return PLUGIN_NAME_RE.test(name);
};

function isWhistleModule(name) {
  return WHISLTE_PLUGIN_RE.test(name);
}

exports.isWhistleModule = isWhistleModule;

function getHomePageFromPackage(pkg) {
  if (HTTP_RE.test(pkg.homepage)) {
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
  if (!HTTP_RE.test(url)) {
    url = url.replace(/^git@([^:]+):/, 'http://$1/');
  }

  return url.replace(/\.git\s*$/i, '');
}

exports.getHomePageFromPackage = getHomePageFromPackage;

exports.parseValues = function (val) {
  if (val) {
    val = util.parseJSON(val);
  }
  if (!val) {
    return '';
  }
  Object.keys(val).forEach(function (key) {
    val[key] = util.toString(val[key]);
  });
  return val;
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
    var name = sync ? RegExp.$1 : RegExp.$1.split('.', 2)[1];
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
          var stats = fs.statSync(pkgPath);
          var pkg = fse.readJsonSync(pkgPath);
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
    fs.readdir(dir, callback);
  });
}

function statFile(filepath, callback) {
  fs.stat(filepath, function (_, stat1) {
    if (stat1) {
      return callback(stat1.isFile() && stat1);
    }
    fs.stat(filepath, function (_, stat2) {
      callback(stat2 && stat2.isFile() && stat2);
    });
  });
}

exports.readFile = readFile;
exports.readDir = readDir;
exports.statFile = statFile;

exports.readDevPlugins = function(callback) {
  var plugins = {};
  readDir(DEV_PLUGINS_PATH, function(err, files) {
    let len = files && files.length;
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
                return statFile(pkgPath, function(stats) {
                  stats && setPlugin(plugins, pkg, root, stats.mtime.getTime());
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
