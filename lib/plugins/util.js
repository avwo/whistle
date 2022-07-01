var fs = require('fs');
var path = require('path');
var util = require('../util');
var config = require('../config');
var protocols = require('../rules/protocols');

var ORG_RE = /^@[\w-]+$/;
var WHISLTE_PLUGIN_RE = /^whistle\.[a-z\d_\-]+$/;
var HTTP_RE = /^https?:\/\//i;
var PLUGIN_NAME_RE = /^(?:@[\w-]+\/)?whistle\.[a-z\d_\-]+$/;
var DEV_PLUGINS_PATH = config.DEV_PLUGINS_PATH;
var MAX_EXPIRE = 36000;

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

exports.readDevPluginPathsSync = function() {
  var paths = [];
  try {
    var files = fs.readdirSync(DEV_PLUGINS_PATH);
    files.forEach(function(file) {
      file = path.join(DEV_PLUGINS_PATH, file);
      try {
        var ctn = fs.readFileSync(file, { encoding: 'utf-8' }).split('\n');
        if (Date.now() - ctn[0] < MAX_EXPIRE && ctn[1]) {
          paths.push(ctn[1]);
        } else {
          fs.unlinkSync(file);
        }
      } catch (e) {}
    });
  } catch (e) {}
  return paths;
};

exports.readDevPluginPaths = function(callback) {
  var paths = [];
  fs.readdir(DEV_PLUGINS_PATH, function(err, files) {
    let len = files && files.length;
    if (!len) {
      return callback(paths);
    }
    files.forEach(function(file) {
      file = path.join(DEV_PLUGINS_PATH, file);
      fs.readFile(file, { encoding: 'utf-8' }, function(_, ctn) {
        ctn = ctn && ctn.split('\n');
        if (ctn && Date.now() - ctn[0] < MAX_EXPIRE && ctn[1]) {
          paths.push(ctn[1]);
        } else {
          fs.unlink(file, util.noop);
        }
        --len === 0 && callback(paths);
      });
    });
  });
};
