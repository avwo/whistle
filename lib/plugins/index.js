var path = require('path');
var p = require('pfork');
var fs = require('fs');
var fse = require('fs-extra2');
var http = require('http');
var LRU = require('lru-cache');
var extend = require('extend');
var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var colors = require('colors/safe');
var util = require('../util');
var logger = require('../util/logger');
var pluginUtil = require('./util');
var config = require('../config');
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var rulesMgr = require('../rules');
var RulesMgr = require('../rules/rules');
var properties = require('../rules/util').properties;
var httpMgr = require('../util/http-mgr');

var encodeURIComponent = util.encodeURIComponent;
var REMOTE_RULES_RE = /^\s*@(`?)(whistle\.[a-z\d_\-]+(?:\/[^\s#]*)?|(?:https?:\/\/|[a-z]:[\\/]|~?\/)[^\s#]+)\s*\1(?:#.*)?$/im;
var PLUGIN_MAIN = path.join(__dirname, './load-plugin');
var PIPE_PLUGIN_RE = /^pipe:\/\/(?:whistle\.|plugin\.)?([a-z\d_\-]+)(?:\(([\s\S]*)\))?$/;
var REQ_FROM_HEADER = config.WHISTLE_REQ_FROM_HEADER;
var RULE_VALUE_HEADER = 'x-whistle-rule-value';
var RULE_URL_HEADER = 'x-whistle-rule-url';
var ETAG_HEADER = 'x-whistle-etag';
var MAX_AGE_HEADER = 'x-whistle-max-age';
var FULL_URL_HEADER = 'x-whistle-full-url';
var REAL_URL_HEADER = 'x-whistle-real-url';
var RELATIVE_URL_HEADER = 'x-whistle-relative-url';
var REQ_ID_HEADER = 'x-whistle-req-id';
var PIPE_VALUE_HEADER = 'x-whistle-pipe-value';
var CUSTOM_PARSER_HEADER = 'x-whistle-frame-parser';
var STATUS_CODE_HEADER = 'x-whistle-status-code';
var PLUGIN_REQUEST_HEADER = 'x-whistle-plugin-request';
var LOCAL_HOST_HEADER = 'x-whistle-local-host';
var PROXY_VALUE_HEADER = 'x-whistle-proxy-value';
var PAC_VALUE_HEADER = 'x-whistle-pac-value';
var METHOD_HEADER = 'x-whistle-method';
var CLIENT_PORT_HEAD = config.CLIENT_PORT_HEAD;
var HOST_IP_HEADER = 'x-whistle-host-ip';
var GLOBAL_VALUE_HEAD = 'x-whistle-global-value';
var INTERVAL = 6000;
var CHECK_INTERVAL = 1000 * 60 * 60;
var portsField = typeof Symbol === 'undefined' ? '_ports' : Symbol('_ports'); // eslint-disable-line
var UTF8_OPTIONS = {encoding: 'utf8'};
var allPlugins = config.networkMode ? {} : getPluginsSync();
var LOCALHOST = '127.0.0.1';
var MAX_RULES_LENGTH = 1024 * 256;
var rulesCache = new LRU({max: 36});
var PLUGIN_HOOKS = config.PLUGIN_HOOKS;
var PLUGIN_HOOK_NAME_HEADER = config.PLUGIN_HOOK_NAME_HEADER;
var conf = {};

if (config.networkMode) {
  getPlugin = function(cb) {
    cb({});
  };
}

/*eslint no-console: "off"*/
Object.keys(config).forEach(function(name) {
  if (name === 'password') {
    return;
  }
  var value = config[name];
  if (name === 'passwordHash') {
    conf.password = value;
  } else {
    var type = typeof value;
    if (type == 'string' || type == 'number' || type === 'boolean') {
      conf[name] = value;
    }
  }
});
conf.PLUGIN_HOOKS = config.PLUGIN_HOOKS;
conf.uiHostList = config.uiHostList;
var pluginHostMap = config.pluginHostMap;
var pluginHosts = conf.pluginHosts = {};
if (pluginHostMap) {
  Object.keys(pluginHostMap).forEach(function(host) {
    var name = pluginHostMap[host];
    var list = pluginHosts[name] = pluginHosts[name] || [];
    list.push(host);
  });
}

pluginMgr.on('updateRules', function() {
  rulesMgr.clearAppend();
  var hasRulesUrl;
  Object.keys(allPlugins).sort(function(a, b) {
    var p1 = allPlugins[a];
    var p2 = allPlugins[b];
    return util.compare(p1.priority, p2.priority) || util.compare(p2.mtime, p1.mtime) || (a > b ? 1 : 0);
  }).forEach(function(name) {
    if (pluginIsDisabled(name.slice(0, -1))) {
      return;
    }
    var plugin = allPlugins[name];
    var rules = plugin.rules;
    if (rules) {
      rules = rules.replace(REMOTE_RULES_RE, function (_, apo, rulesUrl) {
        hasRulesUrl = true;
        rulesUrl = util.getPluginRulesUrl(rulesUrl);
        if (apo) {
          rulesUrl = util.setConfigVar(rulesUrl);
        }
        return httpMgr.add(rulesUrl, config.runtimeHeaders);
      });
      rulesMgr.append(rules, plugin.path);
    }
  });
  if (!hasRulesUrl) {
    httpMgr.clean();
  }
});
pluginMgr.emit('updateRules');

function updateRules() {
  pluginMgr.emit('updateRules');
}

httpMgr.addChangeListener(updateRules);

pluginMgr.updateRules = updateRules;

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

  uninstallData && Object.keys(uninstallData).forEach(function(name) {
    console.log(colors.red(util.formatDate(new Date(uninstallData[name].mtime)) + ' [uninstall plugin] ' + name.slice(0, -1)));
  });
  installData && Object.keys(installData).forEach(function(name) {
    console.log(colors.green(util.formatDate(new Date(installData[name].mtime)) + ' [install plugin] ' + name.slice(0, -1)));
  });
  updateData && Object.keys(updateData).forEach(function(name) {
    console.log(colors.yellow(util.formatDate(new Date(updateData[name].mtime)) + ' [update plugin] ' + name.slice(0, -1)));
  });
}

function readReqRules(dir, callback) {
  fs.readFile(path.join(path.join(dir, '_rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
    if (err) {
      fs.readFile(path.join(path.join(dir, 'reqRules.txt')), UTF8_OPTIONS, function(_, rulesText) {
        callback(util.trim(rulesText));
      });
      return;
    }
    callback(util.trim(rulesText));
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
      fse.readJson(newPkg.pkgPath, function(err, result) {
        if (result && result.version) {
          var conf = result.whistleConfig || '';
          var hintList = util.getHintList(conf);
          var simpleName = name.slice(0, -1);
          newPkg.version = result.version;
          newPkg.priority = parseInt(conf.priority, 10) || parseInt(result.pluginPriority, 10) || 0;
          newPkg.rulesUrl = util.getCgiUrl(conf.rulesUrl);
          newPkg.valuesUrl = util.getCgiUrl(conf.valuesUrl);
          newPkg.networkMenus = util.getPluginMenu(conf.networkMenus || conf.networkMenu, simpleName);
          newPkg.rulesMenus = util.getPluginMenu(conf.rulesMenus || conf.rulesMenu, simpleName);
          newPkg.valuesMenus = util.getPluginMenu(conf.valuesMenus || conf.valuesMenu, simpleName);
          newPkg[util.PLUGIN_MENU_CONFIG] = util.getPluginMenuConfig(conf);
          newPkg.hintUrl = hintList ? undefined : util.getCgiUrl(conf.hintUrl);
          newPkg.hintList = hintList;
          newPkg.hideShortProtocol = !!conf.hideShortProtocol,
          newPkg.hideLongProtocol = !!conf.hideLongProtocol,
          newPkg.homepage = pluginUtil.getHomePageFromPackage(result);
          newPkg.description = result.description;
          newPkg.moduleName = result.name;
          newPkg.pluginHomepage = pluginUtil.getPluginHomepage(result);
          newPkg.registry = util.getRegistry(result);
          newPkg.latest = pkg && pkg.latest;
          _plugins[name] = newPkg;
          fs.readFile(path.join(path.join(newPkg.path, 'rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
            newPkg.rules = util.renderPluginRules(util.trim(rulesText), result, simpleName);
            readReqRules(newPkg.path, function(rulesText) {
              newPkg._rules = util.renderPluginRules(util.trim(rulesText), result, simpleName);
              fs.readFile(path.join(path.join(newPkg.path, '_values.txt')), UTF8_OPTIONS, function(err, rulesText) {
                newPkg[util.PLUGIN_VALUES] = pluginUtil.parseValues(util.renderPluginRules(rulesText, result, simpleName));
                fs.readFile(path.join(path.join(newPkg.path, 'resRules.txt')), UTF8_OPTIONS, function(err, rulesText) {
                  newPkg.resRules = util.renderPluginRules(util.trim(rulesText), result, simpleName);
                  callbackHandler();
                });
              });
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

function checkUpdate(pluginNames) {
  pluginNames = pluginNames || Object.keys(allPlugins);
  var name = pluginNames.shift();
  var plugin;
  while(name) {
    if ((plugin = allPlugins[name]) && !plugin.isProj) {
      break;
    }
    name = pluginNames.shift();
  }
  if (name) {
    util.getLatestVersion(plugin, function(ver) {
      if (ver && plugin.version !== ver) {
        plugin.latest = ver;
      }
      checkUpdate(pluginNames);
    });
  } else {
    setTimeout(checkUpdate, CHECK_INTERVAL);
  }
}
setTimeout(checkUpdate, 5000);

(function update() {
  !config.inspectMode && setTimeout(function() {
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

function getValue(rule) {
  if (!rule) {
    return;
  }
  var value = util.getMatcherValue(rule) || '';
  value += (rule.port ? ':' + rule.port : '');
  return encodeURIComponent(value);
}

function addRealUrl(req, newHeaders) {
  if (!newHeaders) {
    return;
  }
  var realUrl = req._realUrl;
  if (!realUrl) {
    var href = req.options && req.options.href;
    realUrl = util.isUrl(href) ? href : null;
  }
  if (realUrl && realUrl != req.fullUrl) {
    newHeaders[REAL_URL_HEADER] = encodeURIComponent(realUrl);
  }
  var rule = req.rules && req.rules.rule;
  if (rule) {
    if (rule.url !== rule.matcher) {
      var relPath = rule.url.substring(rule.matcher.length);
      newHeaders[RELATIVE_URL_HEADER] = encodeURIComponent(relPath);
    }
    if (rule.url) {
      newHeaders[RULE_URL_HEADER] = encodeURIComponent(rule.url);
    }
  }
}

function addRuleHeaders(req, rules, headers) {
  rules = rules || '';
  headers = headers || req.headers;
  var localHost = getValue(rules.host);
  if (localHost) {
    headers[LOCAL_HOST_HEADER] = localHost;
  }
  var ruleValue = util.getMatcherValue(rules.rule);
  if (ruleValue) {
    headers[RULE_VALUE_HEADER] = encodeURIComponent(ruleValue);
  }
  addRealUrl(req, headers);
  var proxyRule = getValue(rules.proxy);
  if (proxyRule) {
    headers[PROXY_VALUE_HEADER] = proxyRule;
  }
  var pac = getValue(rules.pac);
  if (pac) {
    headers[PAC_VALUE_HEADER] = pac;
  }
  if (req.reqId) {
    headers[REQ_ID_HEADER] = req.reqId;
  }
  if (req._pipeValue) {
    headers[PIPE_VALUE_HEADER] = encodeURIComponent(req._pipeValue);
  }
  if (req.customParser) {
    headers[CUSTOM_PARSER_HEADER] = req.customParser;
  }

  if (req.fullUrl) {
    headers[FULL_URL_HEADER] = encodeURIComponent(req.fullUrl);
  }
  if (req.clientIp) {
    headers[config.CLIENT_IP_HEAD] = req.clientIp;
  }
  if (req.clientPort) {
    headers[config.CLIENT_PORT_HEAD] = req.clientPort;
  }
  if (req.globalValue) {
    headers[config.GLOBAL_VALUE_HEAD] = encodeURIComponent(req.globalValue);
  }
  return headers;
}

pluginMgr.addRuleHeaders = addRuleHeaders;


function loadPlugin(plugin, callback) {
  if (!plugin) {
    return callback();
  }
  var ports = plugin[portsField];
  if (ports) {
    return callback(null, ports);
  }
  util.getBoundIp(function(host) {
    conf.host = host || LOCALHOST;
    p.fork({
      data: config.getPluginData(plugin.moduleName),
      _inspect: config.inspectMode,
      name: plugin.moduleName,
      script: PLUGIN_MAIN,
      value: plugin.path,
      REQ_FROM_HEADER: REQ_FROM_HEADER,
      RULE_VALUE_HEADER: RULE_VALUE_HEADER,
      RULE_URL_HEADER: RULE_URL_HEADER,
      MAX_AGE_HEADER: MAX_AGE_HEADER,
      ETAG_HEADER: ETAG_HEADER,
      FULL_URL_HEADER: FULL_URL_HEADER,
      REAL_URL_HEADER: REAL_URL_HEADER,
      RELATIVE_URL_HEADER: RELATIVE_URL_HEADER,
      REQ_ID_HEADER: REQ_ID_HEADER,
      PIPE_VALUE_HEADER: PIPE_VALUE_HEADER,
      CUSTOM_PARSER_HEADER: CUSTOM_PARSER_HEADER,
      STATUS_CODE_HEADER: STATUS_CODE_HEADER,
      PLUGIN_REQUEST_HEADER: PLUGIN_REQUEST_HEADER,
      LOCAL_HOST_HEADER: LOCAL_HOST_HEADER,
      HOST_VALUE_HEADER: LOCAL_HOST_HEADER,
      PROXY_VALUE_HEADER: PROXY_VALUE_HEADER,
      PAC_VALUE_HEADER: PAC_VALUE_HEADER,
      METHOD_HEADER: METHOD_HEADER,
      CLIENT_IP_HEADER: config.CLIENT_IP_HEAD,
      CLIENT_PORT_HEAD: CLIENT_PORT_HEAD,
      GLOBAL_VALUE_HEAD: GLOBAL_VALUE_HEAD,
      HOST_IP_HEADER: HOST_IP_HEADER,
      debugMode: config.debugMode,
      config: conf
    }, function(err, ports, child, first) {
      callback(err, ports);
      if (!first) {
        return;
      }
      if (err) {
        logger.error(err);
        var mode = process.env.PFORK_MODE;
        if (config.debugMode || mode === 'inline' || mode === 'bind') {
          console.log(err);
        }
      } else {
        plugin[portsField] = ports;
        child.on('close', function() {
          delete plugin[portsField];
        });
      }
    });
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
  if (config.notAllowedDisablePlugins) {
    return false;
  }
  if (properties.get('disabledAllPlugins')) {
    return true;
  }
  var disabledPlugins = properties.get('disabledPlugins') || {};
  return disabledPlugins[name];
}

function _getPlugin(protocol) {
  return pluginIsDisabled(protocol.slice(0, -1)) ? null : allPlugins[protocol];
}

pluginMgr.isDisabled = pluginIsDisabled;
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

function loadPlugins(plugins, callback) {
  plugins = plugins.map(function(plugin) {
    return plugin.plugin;
  });
  var rest = plugins.length;
  var results = [];
  var execCallback = function() {
    --rest <= 0 && callback(results);
  };
  plugins.forEach(function(plugin, i) {
    loadPlugin(plugin, function(err, ports) {
      plugin.ports = ports;
      results[i] = ports || null;
      execCallback();
    });
  });
}

function parseRulesList(req, results, isResRules) {
  var values = {};
  results = results.filter(emptyFilter);
  results.reverse().forEach(function(item) {
    extend(values, item.values);
  });
  var pluginRulesMgr = new RulesMgr(values);
  pluginRulesMgr.parse(results);
  if (isResRules) {
    req.curUrl = req.fullUrl;
    util.mergeRules(req, pluginRulesMgr.resolveRules(req), true);
  }
  return pluginRulesMgr;
}

function getRulesFromPlugins(type, req, res, callback) {
  var plugins = req.whistlePlugins;
  loadPlugins(plugins, function(ports) {
    var needNetworkData;
    ports = ports.map(function(port, i) {
      var plugin = plugins[i];
      if (!needNetworkData && port && type === 'rules' && 
        (port.statsPort || port.resRulesPort || port.resStatsPort)) {
        needNetworkData = true;
      }
      return {
        port: port && port[type + 'Port'],
        plugin: plugin.plugin,
        value: plugin.value,
        url: plugin.url
      };
    });

    var rest = ports.length;
    if (!rest) {
      return callback();
    }

    var results = [];
    var options = getOptions(req, res, type);
    var isResRules = type == 'resRules';
    var hookName = isResRules ? 'RES_RULES' : (type === 'tunnelRules' ? 'TUNNEL_RULES' : 'REQ_RULES');
    options.headers[PLUGIN_HOOK_NAME_HEADER] = PLUGIN_HOOKS[hookName];
    var execCallback = function() {
      if (--rest === 0) {
        if (req.resScriptRules) {
          results = results.concat(req.resScriptRules);
        }
        callback(parseRulesList(req, results, isResRules));
      }
    };
    ports.forEach(function(item, i) {
      var plugin = item.plugin;
      if (!item.port) {
        var rulesText = isResRules ? plugin.resRules : plugin._rules;
        if (rulesText) {
          results[i] = {
            text: rulesText,
            values: plugin[util.PLUGIN_VALUES],
            root: plugin.path
          };
        }
        return execCallback();
      }

      var opts = extend({}, options);
      opts.headers = extend({}, options.headers);
      opts.port = item.port;
      if (item.value) {
        opts.headers[RULE_VALUE_HEADER] = encodeURIComponent(item.value);
      } else {
        opts.headers[RULE_VALUE_HEADER] = '';
      }
      addRealUrl(req, opts.headers);
      var cacheKey = plugin.moduleName + '\n' + type;
      var data = rulesCache.get(cacheKey);
      var updateMaxAge = function(obj, age) {
        if (age >= 0) {
          obj.maxAge = age;
          obj.now = Date.now();
        }
      };
      var handleRules = function(err, body, values, raw, res) {
        if (err === false && data) {
          body = data.body;
          values = data.values;
          raw = data.raw;
          updateMaxAge(data, res && res.headers[MAX_AGE_HEADER]);
        } else if (res) {
          var etag = res.headers[ETAG_HEADER];
          var maxAge = res.headers[MAX_AGE_HEADER];
          var newData;
          if (maxAge >= 0) {
            newData = newData || {};
            updateMaxAge(newData, maxAge);
          }
          if (etag) {
            newData = newData || {};
            newData.etag = etag;
          }
          if (newData) {
            newData.body = body;
            newData.values = values;
            newData.raw = raw;
            rulesCache.set(cacheKey, newData);
          } else {
            rulesCache.del(cacheKey);
          }
        }
        var pendingCallbacks = data && data.pendingCallbacks;
        if (pendingCallbacks) {
          delete data.pendingCallbacks;
          pendingCallbacks.forEach(function(cb) {
            cb(err, body, values, raw);
          });
        }
        body = body || '';
        if (isResRules) {
          body += plugin.resRules ? '\n' + plugin.resRules : ''; 
        } else {
          body += plugin._rules ? '\n' + plugin._rules : '';
        }
        if (body || values) {
          var pluginVals = plugin[util.PLUGIN_VALUES];
          if (values && pluginVals) {
            var vals = extend({}, pluginVals);
            values = extend(vals, values);
          } else {
            values = values || pluginVals;
          }
          results[i] = {
            text: body,
            values: values,
            root: plugin.path
          };
        }
        execCallback();
      };
      delete opts.headers[ETAG_HEADER];
      if (data) {
        if (Date.now() - data.now <= data.maxAge) {
          return handleRules(false);
        }
        if (data.etag) {
          opts.headers[ETAG_HEADER] = data.etag;
        }
        if (data.maxAge >= 0) {
          if (data.pendingCallbacks) {
            data.pendingCallbacks.push(handleRules);
            return;
          }
          data.pendingCallbacks = [];
        }
      }
      opts.ignoreExceedError = true;
      opts.maxLength = MAX_RULES_LENGTH;
      requestRules(opts, handleRules);
    });
  });
}

function getOptions(req, res, type) {
  var fullUrl = req.fullUrl;
  var options = util.parseUrl(fullUrl);
  var isResRules = res && type === 'resRules';
  var headers = extend({}, isResRules ? res.headers : req.headers);
  delete headers.upgrade;
  delete headers.connection;

  options.headers = addRuleHeaders(req, req.rules, headers);
  delete headers['content-length'];
  headers[METHOD_HEADER] = encodeURIComponent(req.method || 'GET');

  if (isResRules) {
    headers.host = req.headers.host;
    headers[HOST_IP_HEADER] = req.hostIp || LOCALHOST;
    headers[STATUS_CODE_HEADER] = encodeURIComponent(res.statusCode == null ? '' : res.statusCode);
    if (req.headers.cookie) {
      headers.cookie = req.headers.cookie;
    } else {
      delete headers.cookie;
    }
  }

  if (req.isPluginReq) {
    headers[PLUGIN_REQUEST_HEADER] = 1;
  }

  options.protocol = 'http:';
  options.host = LOCALHOST;
  options.hostname = null;
  options.agent = false;

  return options;
}

function requestRules(options, callback, retryCount) {
  retryCount = retryCount || 0;
  util.request(options, function(err, body, res) {
    if (err && retryCount < 5) {
      return requestRules(options, callback, ++retryCount);
    }
    if (res && res.statusCode == 304) {
      return callback(false, null, null, null, res);
    }
    body = body && body.trim();
    var rules = body;
    var values = null;
    var data = !err && rulesToJson(body);
    if (data) {
      rules = data.text;
      values = data.values;
    }
    callback(err, rules, values, body, res);
  });
}

function rulesToJson(body) {
  if (body && /^\{[\s\S]+\}$/.test(body)) {
    try {
      body = JSON.parse(body);
      return {
        root: typeof body.root === 'string' ? body.root : null,
        text: typeof body.rules === 'string' ? body.rules : '',
        values: body.values
      };
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

function getPluginRulesCallback(req, callback) {
  return function(pluginRules) {
    req.pluginRules = pluginRules;
    if (req.headers[REQ_FROM_HEADER] === 'W2COMPOSER') {
      delete req.headers[REQ_FROM_HEADER];
    }
    callback(pluginRules);
  };
}

function resolvePipePlugin(req, callback) {
  if (req._pipePlugin == null) {
    var pipe = rulesMgr.resolvePipe(req);
    if (!pipe && req.headerRulesMgr) {
      pipe = req.headerRulesMgr.resolvePipe(req);
    }
    var plugin;
    req._pipeRule = pipe;
    if (pipe && PIPE_PLUGIN_RE.test(pipe.matcher)) {
      req._pipeValue = RegExp.$2;
      plugin = _getPlugin(RegExp.$1 + ':');
    }
    req._pipePlugin = plugin || '';
  }
  loadPlugin(req._pipePlugin, function(_, ports) {
    req._pipePluginPorts = ports || '';
    callback(ports);
  });
}

pluginMgr.resolvePipePlugin = resolvePipePlugin;

function getPipe(type, hookName) {
  var isRes = type.toLowerCase().indexOf('res') !== -1;
  hookName = PLUGIN_HOOKS[hookName];
  return function(req, res, callback) {
    if (!isRes) {
      callback = res;
      res = null;
    }
    resolvePipePlugin(req, function(ports) {
      var port = ports && ports[type + 'Port'];
      if (!port) {
        return callback();
      }
      var options = getOptions(req, res, isRes && 'resRules');
      options.headers[PLUGIN_HOOK_NAME_HEADER] = hookName;
      var done, hasError, pipeSock;
      options.proxyHost = LOCALHOST;
      options.proxyPort = port;
      delete options.headers[CUSTOM_PARSER_HEADER];
      var handleError = function(err) {
        if (!hasError && !done) {
          hasError = done = true;
          err && config.debugMode && console.log(req._pipeRule.matcher, type, err);
          err = err || new Error('closed');
          pipeSock && pipeSock.destroy();
          (res || req).emit('error', err);
        }
      };
      var handleConnect = function(socket, _res) {
        util.onSocketEnd(socket, handleError);
        if (done) {
          return socket.destroy();
        }
        pipeSock = socket;
        callback(socket);
      };
      if (req._websocketExtensions !== null) {
        if (req._websocketExtensions) {
          req.headers['sec-websocket-extensions'] = req._websocketExtensions;
        } else {
          delete req.headers['sec-websocket-extensions'];
        }
      }
      var client = config.connect(options, handleConnect);
      client.on('error', function() {
        client = !done && config.connect(options, handleConnect);
        client && util.onSocketEnd(client, handleError);
      });
      var handleClose = function() {
        done = true;
        client && req._hasError && client.abort();
      };
      if (res) {
        res.on('finish', handleClose);
      } else {
        req.on('end', handleClose);
      }
      util.onSocketEnd(req, handleClose);
    });
  };
}

pluginMgr.getReqReadPipe = getPipe('reqRead', 'REQ_READ');
pluginMgr.getReqWritePipe = getPipe('reqWrite', 'REQ_WRITE');
pluginMgr.getResReadPipe = getPipe('resRead', 'RES_READ');
pluginMgr.getResWritePipe = getPipe('resWrite', 'RES_WRITE');

var getWsReqReadPipe = getPipe('wsReqRead', 'WS_REQ_READ');
var getWsReqWritePipe = getPipe('wsReqWrite', 'WS_REQ_WRITE');
var getWsResReadPipe = getPipe('wsResRead', 'WS_RES_READ');
var getWsResWritePipe = getPipe('wsResWrite', 'WS_RES_WRITE');
var getTunnelReqReadPipe = getPipe('tunnelReqRead', 'TUNNEL_REQ_READ');
var getTunnelReqWritePipe = getPipe('tunnelReqWrite', 'TUNNEL_REQ_WRITE');
var getTunnelResReadPipe = getPipe('tunnelResRead', 'TUNNEL_RES_READ');
var getTunnelResWritePipe = getPipe('tunnelResWrite', 'TUNNEL_RES_WRITE');

pluginMgr.getWsPipe = function(req, res, callback) {
  req._websocketExtensions = res.headers['sec-websocket-extensions'] || '';
  getWsReqReadPipe(req, function(reqRead) {
    getWsReqWritePipe(req, function(reqWrite) {
      getWsResReadPipe(req, res, function(resReadStream) {
        getWsResWritePipe(req, res, function(resWriteStream) {
          callback(reqRead, reqWrite, resReadStream, resWriteStream);
        });
      });
    });
  });
};

pluginMgr.getTunnelPipe = function(req, res, callback) {
  getTunnelReqReadPipe(req, function(reqRead) {
    getTunnelReqWritePipe(req, function(reqWrite) {
      getTunnelResReadPipe(req, res, function(resRead) {
        getTunnelResWritePipe(req, res, function(resWrite) {
          callback(reqRead, reqWrite, resRead, resWrite);
        });
      });
    });
  });
};

pluginMgr.getRules = function(req, callback) {
  getRulesMgr('rules', req, null, getPluginRulesCallback(req, callback));
};

pluginMgr.getResRules = function(req, res, callback) {
  req.curUrl = req.fullUrl;
  var resRules = rulesMgr.resolveResRules(req, true);
  util.mergeRules(req, resRules, true);
  var resScriptRules;
  var resHeaderRules = res.headers[config.RES_RULES_HEAD];
  if (resHeaderRules) {
    try {
      resHeaderRules = rulesToJson(decodeURIComponent(resHeaderRules));
      if (resHeaderRules) {
        resScriptRules = resScriptRules || [];
        resScriptRules.push(resHeaderRules);
      }
    } catch(e) {}
  }
  delete res.headers[config.RES_RULES_HEAD];
  rulesMgr.resolveResRulesFile(req, res, function(result) {
    if (result) {
      resScriptRules = resScriptRules || [];
      resScriptRules.push(result);
    }
    req.resScriptRules = resScriptRules;
    getRulesMgr('resRules', req, res, function(pluginRulesMgr) {
      if (!pluginRulesMgr && resScriptRules) {
        pluginRulesMgr = parseRulesList(req, resScriptRules, true);
      }
      req.resScriptRules = resScriptRules = null;
      callback(pluginRulesMgr);
    });
  });
};

pluginMgr.getTunnelRules = function(req, callback) {
  getRulesMgr('tunnelRules', req, null, getPluginRulesCallback(req, callback));
};

function postStats(req, res) {
  var plugins = req.whistlePlugins;
  var type = res ? '_postResStats' : '_postReqStats';
  if (!plugins || req.isPluginReq || req[type]) {
    return;
  }
  req[type] = true;
  loadPlugins(plugins, function(ports) {
    ports = ports.map(function(port, i) {
      var plugin = plugins[i];
      var statsPort = port && (res ? port.resStatsPort : port.statsPort);
      if (!statsPort) {
        return;
      }
      return {
        port: statsPort,
        value: plugin.value,
        url: plugin.url
      };
    }).filter(emptyFilter);

    if (!ports.length) {
      return;
    }
    var options = getOptions(req, res, 'resRules');
    options.headers[PLUGIN_HOOK_NAME_HEADER] = PLUGIN_HOOKS[res ? 'RES_STATS' : 'REQ_STATS'];
    ports.forEach(function(item) {
      var opts = extend({}, options);
      opts.headers = extend({}, options.headers);
      opts.port = item.port;
      if (item.value) {
        opts.headers[RULE_VALUE_HEADER] = encodeURIComponent(item.value);
      }
      addRealUrl(req, opts.headers);
      var request = http.request(opts, function(response) {
        response.on('error', util.noop);
        response.on('data', util.noop);
      });
      request.on('error', util.noop);
      request.end();
    });
  });
}

pluginMgr.postStats = postStats;

var PLUGIN_RULE_RE = /^([a-z\d_\-]+)(?:\(([\s\S]*)\))?$/;
var PLUGIN_RULE_RE2 = /^(?:\w+\.)?([a-z\d_\-]+)(?:\:\/\/([\s\S]*))?$/;
var PLUGIN_RE = /^plugin:\/\//;

function getPluginByPluginRule(pluginRule) {
  if (!pluginRule) {
    return;
  }

  var value = pluginRule.matcher;
  if (PLUGIN_RE.test(value)) {
    value = util.getMatcherValue(pluginRule);
  } else {
    value = util.rule.getMatcher(pluginRule);
  }

  if (PLUGIN_RULE_RE.test(value) || PLUGIN_RULE_RE2.test(value)) {
    value = RegExp.$2;
    var plugin = _getPlugin(RegExp.$1 + ':');
    if (!plugin) {
      return;
    }
    var ruleUrl = util.getUrlValue(pluginRule, true);
    return plugin && {
      plugin: plugin,
      value: value,
      url: ruleUrl == value ? undefined : ruleUrl
    };
  }
}

function resolveWhistlePlugins(req) {
  var rules = req.rules;
  var plugins = [];
  var plugin = req.pluginMgr = getPluginByRuleUrl(util.rule.getUrl(rules.rule));
  if (plugin) {
    rules._pluginRule = rules.rule;
    var ruleValue = util.getMatcherValue(rules.rule);
    var ruleUrl = util.getUrlValue(rules.rule, true);
    plugins.push({
      plugin: plugin,
      value: ruleValue,
      url: ruleUrl == ruleValue ? undefined : ruleUrl
    });
  }
  if (rules.plugin) {
    var _plugins = [plugin];
    rules.plugin.list.forEach(function(_plugin) {
      _plugin = getPluginByPluginRule(_plugin);
      if (_plugin && _plugins.indexOf(_plugin.plugin) == -1) {
        _plugins.push(_plugin.plugin);
        plugins.push(_plugin);
      }
    });
  }
  if (plugins.length) {
    req.whistlePlugins = plugins;
  }
  return plugin;
}

pluginMgr.resolveWhistlePlugins = resolveWhistlePlugins;

pluginMgr.updatePluginRules = function(name) {
  name && httpMgr.forceUpdate('http://127.0.0.1:' + config.port + '/whistle.' + name + '/');
};

module.exports = pluginMgr;
