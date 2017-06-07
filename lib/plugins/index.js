var path = require('path');
var p = require('pfork');
var fs = require('fs');
var fse = require('fs-extra');
var url = require('url');
var http = require('http');
var extend = require('util')._extend;
var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var colors = require('colors/safe');
var comUtil = require('../util');
var logger = require('../util/logger');
var util = require('./util');
var config = require('../config');
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var rulesMgr = require('../rules');
var RulesMgr = require('../rules/rules');
var properties = require('../rules/util').properties;
var PLUGIN_MAIN = path.join(__dirname, './load-plugin');
var RULE_VALUE_HEADER = 'x-whistle-rule-value';
var SSL_FLAG_HEADER = 'x-whistle-https';
var FULL_URL_HEADER = 'x-whistle-full-url';
var REAL_URL_HEADER = 'x-whistle-real-url';
var CUR_RULE_HEADER = 'x-whistle-rule';
var NEXT_RULE_HEADER = 'x-whistle-next-rule';
var REQ_ID_HEADER = 'x-whistle-req-id';
var DATA_ID_HEADER = 'x-whistle-data-id';
var STATUS_CODE_HEADER = 'x-whistle-status-code';
var LOCAL_HOST_HEADER = 'x-whistle-local-host';
var CUR_HOST_HEADER = 'x-whistle-host';
var CUR_PROXY_HEADER = 'x-whistle-proxy';
var METHOD_HEADER = 'x-whistle-method';
var CLIENT_IP_HEADER = 'x-forwarded-for';
var HOST_IP_HEADER = 'x-whistle-host-ip';
var INTERVAL = 6000;
var UTF8_OPTIONS = {encoding: 'utf8'};
var allPlugins = getPluginsSync();
var LOCALHOST = '127.0.0.1';
var conf = {};

/*eslint no-console: "off"*/
Object.keys(config).forEach(function(name) {
  if (name === 'username' || name === 'password') {
    return;
  }
  var value = config[name];
  if (typeof value == 'string' || typeof value == 'number') {
    conf[name] = value;
  }
});

pluginMgr.on('updateRules', function() {
  rulesMgr.clearAppend();
  Object.keys(allPlugins).sort(function(a, b) {
    var p1 = allPlugins[a];
    var p2 = allPlugins[b];
    return (p1.mtime > p2.mtime) ? 1 : -1;
  }).forEach(function(name) {
    if (pluginIsDisabled(name.slice(0, -1))) {
      return;
    }
    var plugin = allPlugins[name];
    if (plugin._rules && !plugin.rulesMgr) {
      plugin.rulesMgr = new RulesMgr();
      plugin.rulesMgr.parse(plugin._rules, plugin.path);
    }
    plugin.rules && rulesMgr.append(plugin.rules, plugin.path);
  });
});
pluginMgr.emit('updateRules');

pluginMgr.updateRules = function() {
  pluginMgr.emit('updateRules');
};

pluginMgr.on('update', function(result) {
  Object.keys(result).forEach(function(name) {
    pluginMgr.stopPlugin(result[name]);
  });
});
pluginMgr.on('uninstall', function(result) {
  Object.keys(result).forEach(function(name) {
    pluginMgr.stopPlugin(result[name]);
  });
});

function showVerbose(oldData, newData) {
  if (!config.debugMode) {
    return;
  }
  var uninstallData, installData, updateData;
  Object.keys(oldData).forEach(function(name) {
    var oldItem = oldData[name];
    var newItem = newData[name];
    if (!newItem) {
      uninstallData = uninstallData || {};
      uninstallData[name] = oldItem;
    } else if (newItem.path != oldItem.path || newItem.mtime != oldItem.mtime) {
      updateData = updateData || {};
      updateData[name] = newItem;
    }
  });

  Object.keys(newData).forEach(function(name) {
    if (!oldData[name]) {
      installData = installData || {};
      installData[name] = newData[name];
    }
  });

  if (uninstallData || installData || updateData) {
    console.log('\n***********[%s] %s has changed***********', comUtil.formatDate(), 'plugins');
  }

  uninstallData && Object.keys(uninstallData).forEach(function(name) {
    console.log(colors.red('[' + comUtil.formatDate(new Date(uninstallData[name].mtime)) + '] [uninstall plugin] ' + name.slice(0, -1)));
  });
  installData && Object.keys(installData).forEach(function(name) {
    console.log(colors.green('[' + comUtil.formatDate(new Date(installData[name].mtime)) + '] [install plugin] ' + name.slice(0, -1)));
  });
  updateData && Object.keys(updateData).forEach(function(name) {
    console.log(colors.yellow('[' + comUtil.formatDate(new Date(updateData[name].mtime)) + '] [update plugin] ' + name.slice(0, -1)));
  });
}

function readPackages(obj, callback) {
  var _plugins = {};
  var count = 0;
  var callbackHandler = function() {
    if (--count <= 0) {
      callback(_plugins);
    }
  };
  Object.keys(obj).forEach(function(name) {
    var pkg = allPlugins[name];
    var newPkg = obj[name];
    if (!pkg || pkg.path != newPkg.path || pkg.mtime != newPkg.mtime) {
      ++count;
      fse.readJson(newPkg.pkgPath, function(err, pkg) {
        if (pkg && pkg.version) {
          newPkg.version = pkg.version;
          newPkg.homepage = util.getHomePageFromPackage(pkg);
          newPkg.description = pkg.description;
          newPkg.moduleName = pkg.name;
          _plugins[name] = newPkg;
          fs.readFile(path.join(path.join(newPkg.path, 'rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
            newPkg.rules = comUtil.trim(rulesText);
            fs.readFile(path.join(path.join(newPkg.path, '_rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
              newPkg._rules = comUtil.trim(rulesText);
              callbackHandler();
            });
          });
        } else {
          callbackHandler();
        }
      });
    } else {
      _plugins[name] = pkg;
    }
  });

  if (count <= 0) {
    callback(_plugins);
  }
}

(function update() {
  setTimeout(function() {
    getPlugin(function(result) {
      readPackages(result, function(_plugins) {
        var updatePlugins, uninstallPlugins;
        var pluginNames = Object.keys(allPlugins);
        pluginNames.forEach(function(name) {
          var plugin = allPlugins[name];
          var newPlugin = _plugins[name];
          if (!newPlugin) {
            uninstallPlugins = uninstallPlugins || {};
            uninstallPlugins[name] = plugin;
          } else if (newPlugin.path != plugin.path || newPlugin.mtime != plugin.mtime) {
            updatePlugins = updatePlugins || {};
            updatePlugins[name] = newPlugin;
          }
        });
        showVerbose(allPlugins, _plugins);
        allPlugins = _plugins;
        if (uninstallPlugins || updatePlugins || Object.keys(_plugins).length !== pluginNames.length) {
          uninstallPlugins && pluginMgr.emit('uninstall', uninstallPlugins);
          updatePlugins && pluginMgr.emit('update', updatePlugins);
          pluginMgr.emit('updateRules');
        }
        update();
      });
    });
  }, INTERVAL);
})();

function addRuleHeaders(req, rules, headers) {
  headers = headers || req.headers;
  var localHost = rules.host;
  if (localHost) {
    headers[LOCAL_HOST_HEADER] =
      headers[CUR_HOST_HEADER] = encodeURIComponent(comUtil.removeProtocol(localHost.matcher, true)
        + (localHost.port ? ':' + localHost.port : ''));
  }
  if (rules.rule) {
    headers[CUR_RULE_HEADER] = encodeURIComponent(rules.rule.rawPattern + ' ' + rules.rule.matcher);
    var ruleValue = comUtil.getMatcherValue(rules.rule);
    if (ruleValue) {
      headers[RULE_VALUE_HEADER] = encodeURIComponent(ruleValue);
    }
  }

  if (rules.proxy) {
    headers[CUR_PROXY_HEADER] = encodeURIComponent(rules.proxy.rawPattern + ' ' + rules.proxy.matcher);
  }
  if (req.realUrl) {
    headers[REAL_URL_HEADER] = encodeURIComponent(req.realUrl);
  }
  if (req.reqId) {
    headers[REQ_ID_HEADER] = req.reqId;
  }

  if (req.dataId) {
    headers[DATA_ID_HEADER] = req.dataId;
  }

  if (req.fullUrl) {
    headers[FULL_URL_HEADER] = encodeURIComponent(req.fullUrl);
    if (/^(?:https|wss):/.test(req.fullUrl)) {
      headers[SSL_FLAG_HEADER] = 'true';
    }
  }
  if (req.clientIp) {
    headers[CLIENT_IP_HEADER] = req.clientIp;
  }
  return headers;
}

pluginMgr.addRuleHeaders = addRuleHeaders;


function loadPlugin(plugin, callback) {
  if (!plugin) {
    return callback();
  }
  p.fork({
    name: plugin.moduleName,
    script: PLUGIN_MAIN,
    value: plugin.path,
    RULE_VALUE_HEADER: RULE_VALUE_HEADER,
    SSL_FLAG_HEADER: SSL_FLAG_HEADER,
    FULL_URL_HEADER: FULL_URL_HEADER,
    REAL_URL_HEADER: REAL_URL_HEADER,
    NEXT_RULE_HEADER: NEXT_RULE_HEADER,
    CUR_RULE_HEADER: CUR_RULE_HEADER,
    REQ_ID_HEADER: REQ_ID_HEADER,
    DATA_ID_HEADER: DATA_ID_HEADER,
    STATUS_CODE_HEADER: STATUS_CODE_HEADER,
    LOCAL_HOST_HEADER: LOCAL_HOST_HEADER,
    CUR_HOST_HEADER: CUR_HOST_HEADER,
    CUR_PROXY_HEADER: CUR_PROXY_HEADER,
    METHOD_HEADER: METHOD_HEADER,
    CLIENT_IP_HEADER: CLIENT_IP_HEADER,
    HOST_IP_HEADER: HOST_IP_HEADER,
    debugMode: config.debugMode,
    config: conf
  }, function(err, ports, child) {
    callback && callback(err, ports, child);
    logger.error(err);
    if (config.debugMode) {
      if (err) {
        console.log(colors.red(err));
      } else if (!child.debugMode) {
        child.debugMode = true;
        child.on('data', function(data) {
          if (data && data.type == 'console.log') {
            console.log('[' + comUtil.formatDate() + '] [plugin] [' + plugin.path.substring(plugin.path.lastIndexOf('.') + 1) + ']', data.message);
          }
        });
        child.sendData({
          type: 'console.log',
          status: 'ready'
        });
      }
    }
  });
}

pluginMgr.loadPlugin = loadPlugin;

pluginMgr.stopPlugin = function(plugin) {
  p.kill({
    script: PLUGIN_MAIN,
    value: plugin.path
  }, 10000);
};

pluginMgr.getPlugins = function() {
  return allPlugins;
};

function pluginIsDisabled(name) {
  if (properties.get('disabledAllPlugins')) {
    return true;
  }
  var disabledPlugins = properties.get('disabledPlugins') || {};
  return disabledPlugins[name];
}

function _getPlugin(protocol) {
  return pluginIsDisabled(protocol.slice(0, -1)) ? null : allPlugins[protocol];
}

pluginMgr.getPlugin = _getPlugin;

function getPluginByName(name) {
  return name && allPlugins[name + ':'];
}

pluginMgr.getPluginByName = getPluginByName;

function getPluginByRuleUrl(ruleUrl) {
  if (!ruleUrl || typeof ruleUrl != 'string') {
    return;
  }
  var index = ruleUrl.indexOf(':');
  if (index == -1) {
    return null;
  }
  var protocol = ruleUrl.substring(0, index + 1);
  return pluginIsDisabled(protocol.slice(0, -1)) ? null : allPlugins[protocol];
}

pluginMgr.getPluginByRuleUrl = getPluginByRuleUrl;

pluginMgr.getPluginByHomePage = function(url) {
  var name = config.getPluginName(url);
  return name && allPlugins[name + ':'];
};

function loadPlugins(req, callback) {
  var plugins = req.whistlePlugins.map(function(plugin) {
    return plugin.plugin;
  });
  var rest = plugins.length;
  var results = [];
  var hasStatusServer;
  var execCallback = function() {
    --rest <= 0 && callback(results, hasStatusServer);
  };
  plugins.forEach(function(plugin, i) {
    if (!plugin) {
      return execCallback();
    }
    loadPlugin(plugin, function(err, ports) {
      if (ports) {
        plugin.ports = ports;
        if (ports.statusPort) {
          hasStatusServer = true;
        }
      }
      results[i] = ports || null;
      execCallback();
    });
  });
}

function getRulesFromPlugins(type, req, res, callback) {
  loadPlugins(req, function(ports, hasStatusServer) {
    var plugins = req.whistlePlugins;
    req.hasStatusServer = hasStatusServer;
    ports = ports.map(function(port, i) {
      var plugin = plugins[i];
      return {
        port: port && port[type + 'Port'],
        plugin: plugin.plugin,
        value: plugin.value
      };
    });

    var rest = ports.length;
    if (!rest) {
      return callback();
    }

    var results = [];
    var options = getOptions(req, res, type);
    var execCallback = function() {
      if (--rest > 0) {
        return;
      }

      var values = {};
      results = results.filter(emptyFilter);
      results.reverse().forEach(function(item) {
        extend(values, item.values);
      });
      if (req.fileRules) {
        results.push({
          text: req.fileRules
        });
      }
      var rulesMgr = new RulesMgr(values);
      rulesMgr.parse(results);
      callback(rulesMgr);
    };
    var isResRules = type == 'resRules';
    ports.forEach(function(item, i) {
      var plugin = item.plugin;
      if (!item.port) {
        if (!isResRules && plugin._rules) {
          results[i] = {
            text: plugin._rules,
            root: plugin.path
          };
        }
        return execCallback();
      }

      var _options = extend({}, options);
      _options.headers = extend({}, options.headers);
      _options.port = item.port;
      if (item.value) {
        _options.headers[RULE_VALUE_HEADER] = encodeURIComponent(item.value);
      }
      requestRules(_options, function(err, body, values, raw) {
        body = (body || '') + (!isResRules && plugin._rules ? '\n' + plugin._rules : '');
        if (body || values) {
          results[i] = {
            text: body,
            values: values,
            root: plugin.path
          };
        }
        execCallback();
      });
    });
  });
}

function getOptions(req, res, type) {
  var rules = req.rules;
  var fullUrl = req.fullUrl;
  var options = url.parse(fullUrl);
  var isResRules = res && type === 'resRules';
  var headers = extend({}, isResRules ? res.headers : req.headers);
  delete headers.upgrade;
  delete headers.connection;

  options.headers = addRuleHeaders(req, rules, headers);
  headers[METHOD_HEADER] = encodeURIComponent(req.method || 'GET');

  if (type === 'rules') {
    var nextRule = rulesMgr.resolveRule(req.fullUrl, 1);
    if (nextRule) {
      headers[NEXT_RULE_HEADER] = encodeURIComponent(nextRule.rawPattern + ' ' + nextRule.matcher);
    }
  }

  if (isResRules) {
    headers.host = req.headers.host;
    headers[HOST_IP_HEADER] = req.hostIp || LOCALHOST;
    headers[STATUS_CODE_HEADER] = encodeURIComponent(res.statusCode == null ? '' : res.statusCode + '');
  }

  options.protocol = 'http:';
  options.host = LOCALHOST;
  options.hostname = null;

  return options;
}

function requestRules(options, callback, retryCount) {
  retryCount = retryCount || 0;
  comUtil.getResponseBody(options, function(err, body) {
    if (err && retryCount < 5) {
      return requestRules(options, callback, ++retryCount);
    }
    body = body && body.trim();
    var data = err ? '' : rulesToJson(body);
    data ? callback(err, typeof data.rules == 'string' ? data.rules : '', data.values, body)
     : callback(err, body, null, body);
  });
}

function rulesToJson(body) {
  if (/^\{[\s\S]+\}$/.test(body)) {
    try {
      return JSON.parse(body);
    } catch(e) {}
  }
}

function emptyFilter(val) {
  return !!val;
}

function getRulesMgr(type, req, res, callback) {
  var plugins = req.whistlePlugins;
  if (!plugins) {
    return callback();
  }
  getRulesFromPlugins(type, req, res, callback);
}

pluginMgr.getRules = function(req, callback) {
  getRulesMgr('rules', req, null, function(pluginRules) {
    req.pluginRules = pluginRules;
    callback(pluginRules);
  });
};

pluginMgr.getResRules = function(req, res, callback) {
  getRulesMgr('resRules', req, res, callback);
};

pluginMgr.getTunnelRules = function(req, callback) {
  getRulesMgr('tunnelRules', req, null, function(pluginRules) {
    req.pluginRules = pluginRules;
    callback(pluginRules);
  });
};

function postStats(req) {
  if (!req.whistlePlugins) {
    return;
  }
  loadPlugins(req, function(ports) {
    var plugins = req.whistlePlugins;
    ports = ports.map(function(port, i) {
      var plugin = plugins[i];
      var statsPort = port && port.statsPort;
      if (!statsPort) {
        return;
      }
      return {
        port: statsPort,
        value: plugin.value
      };
    }).filter(emptyFilter);

    if (!ports.length) {
      return;
    }
    var options = getOptions(req);
    ports.forEach(function(item) {
      var opts = extend({}, options);
      opts.headers = extend({}, options.headers);
      opts.port = item.port;
      if (item.value) {
        opts.headers[RULE_VALUE_HEADER] = encodeURIComponent(item.value);
      }
      var request = http.request(opts, function(response) {
        response.on('error', comUtil.noop);
        response.on('data', comUtil.noop);
      });
      request.on('error', comUtil.noop);
      request.end();
    });
  });
}

pluginMgr.postStats = postStats;

function postStatus(req, data) {
  if (!req.whistlePlugins) {
    return;
  }
  var sendStatus = function(plugin) {
    data.ruleValue = plugin.value;
    var dataStr = JSON.stringify(data);
    var options = {
      host: '127.0.0.1',
      port: plugin.port,
      method: 'POST'
    };
    var request = http.request(options, function(response) {
      response.on('error', comUtil.noop);
      response.on('data', comUtil.noop);
    });
    request.on('error', comUtil.noop);
    request.end(dataStr);
  };

  loadPlugins(req, function(ports) {
    var plugins = req.whistlePlugins;
    ports = ports.map(function(port, i) {
      port = port && port.statusPort;
      if (port) {
        return {
          port: port,
          value: plugins[i].value
        };
      }
    }).filter(emptyFilter);
    ports.forEach(sendStatus);
  });
}

pluginMgr.postStatus = postStatus;

var PLUGIN_RULE_RE = /^([a-z\d_\-]+)(?:\(([\s\S]*)\))?$/;
var PLUGIN_RULE_RE2 = /^([a-z\d_\-]+)(?:\:\/\/([\s\S]*))?$/;
var PLUGIN_RE = /^plugin:\/\//;

function getPluginByPluginRule(pluginRule) {
  if (!pluginRule) {
    return;
  }

  var value = pluginRule.matcher;
  if (PLUGIN_RE.test(value)) {
    value = comUtil.getMatcherValue(pluginRule);
  } else {
    value = value.substring(value.indexOf('.') + 1);
  }

  if (PLUGIN_RULE_RE.test(value) || PLUGIN_RULE_RE2.test(value)) {
    var plugin = _getPlugin(RegExp.$1 + ':');
    return plugin && {
      plugin: plugin,
      value: RegExp.$2
    };
  }
}

function resolveWhistlePlugins(req) {
  var rules = req.rules;
  var plugins = [];
  var plugin = req.pluginMgr = getPluginByRuleUrl(comUtil.rule.getUrl(rules.rule));
  if (plugin) {
    plugins.push({
      plugin: plugin,
      value: plugin && comUtil.getMatcherValue(rules.rule)
    });
  }
  if (rules.plugin) {
    var _plugins = [plugin];
    rules.plugin.list.forEach(function(_plugin) {
      _plugin = getPluginByPluginRule(_plugin);
      if (_plugins.indexOf(_plugin.plugin) == -1) {
        _plugins.push(_plugin.plugin);
        plugins.push(_plugin);
      }
    });
  }

  if (plugins.length) {
    req.whistlePlugins = plugins;
  }
  !/^tunnel:/.test(req.fullUrl) && postStats(req);
  return plugin;
}

pluginMgr.resolveWhistlePlugins = resolveWhistlePlugins;

module.exports = pluginMgr;


