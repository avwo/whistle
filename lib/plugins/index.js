var path = require('path');
var p = require('pfork');
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
var protocols = require('../rules/protocols');

var encodeURIComponent = util.encodeURIComponent;
var REMOTE_RULES_RE =
  /^\s*@(`?)(whistle\.[a-z\d_\-]+(?:\/[^\s#]*)?|(?:https?:\/\/|[a-z]:[\\/]|~?\/)[^\s#]+|\$(?:whistle\.)?[a-z\d_-]+[/:][^\s#]+)\s*?\1(?:#.*)?$/im;
var PLUGIN_MAIN = path.join(__dirname, './load-plugin');
var PIPE_PLUGIN_RE =
  /^pipe:\/\/(?:whistle\.|plugin\.)?([a-z\d_\-]+)(?:\(([\s\S]*)\))?$/;
var RULE_VALUE_HEADER = 'x-whistle-rule-value';
var SNI_VALUE_HEADER = 'x-whistle-sni-value';
var GLOBAL_PLUGIN_VARS_HEAD = 'x-whistle-global-plugin-vars' + config.uid;
var PLUGIN_VARS_HEAD = 'x-whistle-plugin-vars' + config.uid;
var RULE_URL_HEADER = 'x-whistle-rule-url';
var ETAG_HEADER = 'x-whistle-etag';
var MAX_AGE_HEADER = 'x-whistle-max-age';
var FULL_URL_HEADER = 'x-whistle-full-url';
var REAL_URL_HEADER = 'x-whistle-real-url';
var RELATIVE_URL_HEADER = 'x-whistle-relative-url';
var EXTRA_URL_HEADER = 'x-whistle-extra-url';
var UI_REQUEST_HEADER = 'x-whistle-auth-ui-request';
var REQ_ID_HEADER = 'x-whistle-req-id';
var PIPE_VALUE_HEADER = 'x-whistle-pipe-value';
var CUSTOM_PARSER_HEADER = 'x-whistle-frame-parser';
var STATUS_CODE_HEADER = 'x-whistle-status-code';
var PLUGIN_REQUEST_HEADER = 'x-whistle-plugin-request';
var LOCAL_HOST_HEADER = 'x-whistle-local-host';
var PROXY_VALUE_HEADER = 'x-whistle-proxy-value';
var PAC_VALUE_HEADER = 'x-whistle-pac-value';
var METHOD_HEADER = 'x-whistle-method';
var SHOW_LOGIN_BOX = 'x-whistle2-show-login-box.' + config.uid;
var FROM_TUNNEL_HEADER = 'x-whistle-from-tunnel-req-' + config.uid;
var CLIENT_PORT_HEAD = config.CLIENT_PORT_HEAD;
var HOST_IP_HEADER = 'x-whistle-host-ip';
var GLOBAL_VALUE_HEAD = 'x-whistle-global-value';
var SERVER_NAME_HEAD = 'x-whistle-server-name';
var COMMON_NAME_HEAD = 'x-whistle-common-name';
var CERT_CACHE_INFO = 'x-whistle-cert-cache-info';
var STATUS_ERR = new Error('Non 200');
var INTERVAL = 6000;
var CHECK_INTERVAL = 1000 * 60 * 60;
var MAX_CERT_SIZE = 72 * 1024;
var portsField = typeof Symbol === 'undefined' ? '_ports' : Symbol('_ports'); // eslint-disable-line
var notLoadPlugins = config.networkMode || config.rulesOnlyMode;
var allPlugins = notLoadPlugins ? {} : getPluginsSync();
var authPlugins = [];
var tunnelKeys = [];
var LOCALHOST = '127.0.0.1';
var MAX_RULES_LENGTH = 1024 * 256;
var rulesCache = new LRU({ max: 36 });
var CUSTOM_CERT_HEADER = config.CUSTOM_CERT_HEADER;
var ENABLE_CAPTURE_HEADER = config.ENABLE_CAPTURE_HEADER;
var PLUGIN_HOOKS = config.PLUGIN_HOOKS;
var PLUGIN_HOOK_NAME_HEADER = config.PLUGIN_HOOK_NAME_HEADER;
var UPGRADE_HEADER = config.UPGRADE_HEADER;
var HTTP_RE = /^https?:\/\/./;
var conf = {};
var EXCLUDE_CONF_KEYS = {
  uid: 1,
  INTERNAL_ID: 1,
  SNI_PLUGIN_HEADER: 1,
  WEBUI_HEAD: 1,
  CLIENT_INFO_HEAD: 1,
  COMPOSER_CLIENT_ID_HEADER: 1,
  TEMP_TUNNEL_DATA_HEADER: 1
};
var EXCLUDE_NAMES = {
  password: 1,
  shadowRules: 1,
  rules: 1,
  values: 1
};
var debugMode = config.debugMode;
var whistleProxy;

if (notLoadPlugins) {
  getPlugin = function (cb) {
    cb({});
  };
}

/*eslint no-console: "off"*/
Object.keys(config).forEach(function (name) {
  if (EXCLUDE_NAMES[name]) {
    return;
  }
  var value = config[name];
  if (name === 'passwordHash') {
    conf.password = value;
  }
  if (name === 'globalData') {
    conf.globalData = value;
  } else if (!EXCLUDE_CONF_KEYS[name]) {
    var type = typeof value;
    if (type == 'string' || type == 'number' || type === 'boolean') {
      conf[name] = value;
    }
  }
});
conf.PLUGIN_HOOKS = config.PLUGIN_HOOKS;
conf.uiHostList = config.uiHostList;
var pluginHostMap = config.pluginHostMap;
var pluginHosts = (conf.pluginHosts = {});
if (pluginHostMap) {
  Object.keys(pluginHostMap).forEach(function (host) {
    var name = pluginHostMap[host];
    var list = (pluginHosts[name] = pluginHosts[name] || []);
    list.push(host);
  });
}

pluginMgr.getTunnelKeys = function () {
  return tunnelKeys;
};

pluginMgr.on('updateRules', function (byParse) {
  rulesMgr.clearAppend();
  authPlugins = [];
  tunnelKeys = [];
  Object.keys(allPlugins)
    .sort(function (a, b) {
      var p1 = allPlugins[a];
      var p2 = allPlugins[b];
      return (
        util.compare(p1.priority, p2.priority) ||
        util.compare(p2.mtime, p1.mtime) ||
        (a > b ? 1 : 0)
      );
    })
    .forEach(function (name) {
      if (pluginIsDisabled(name.slice(0, -1))) {
        return;
      }
      var plugin = allPlugins[name];
      var rules = plugin.rules;
      if (plugin.enableAuthUI) {
        authPlugins.push(plugin);
      }
      if (plugin.tunnelKey) {
        plugin.tunnelKey.forEach(function (key) {
          if (tunnelKeys.indexOf(key) === -1) {
            tunnelKeys.push(key);
          }
        });
      }
      if (rules) {
        rules = rules.replace(REMOTE_RULES_RE, function (_, apo, rulesUrl) {
          return util.getRemoteRules(apo, rulesUrl);
        });
        rulesMgr.append(rules, plugin.path, true);
      }
    });
  if (byParse !== true) {
    httpMgr.triggerChange();
  }
});

pluginMgr.updateRules = function() {
  pluginMgr.emit('updateRules');
};

pluginMgr.loadCert = function (req, plugin, callback) {
  loadPlugin(plugin, function (err, ports) {
    if (err || !ports || !ports.sniPort) {
      return callback();
    }
    var options = getOptions(req);
    options.maxLength = MAX_CERT_SIZE;
    options.headers[PLUGIN_HOOK_NAME_HEADER] = PLUGIN_HOOKS.SNI;
    options.headers[SERVER_NAME_HEAD] = encodeURIComponent(req.serverName);
    options.headers[COMMON_NAME_HEAD] = encodeURIComponent(req.commonName);
    if (!req.useSNI || req.isHttpsServer) {
      options.headers[config.SNI_TYPE_HEADER] = req.isHttpsServer ? '1' : '0';
    }
    if (req.sniRuleValue) {
      options.headers[SNI_VALUE_HEADER] = encodeURIComponent(req.sniRuleValue);
    }
    if (req.hasCertCache) {
      options.headers[CERT_CACHE_INFO] = req.hasCertCache;
    }
    options.port = ports.sniPort;
    requestPlugin(options, function (err, body, res) {
      if (err || res.statusCode !== 200) {
        return callback(err || STATUS_ERR);
      }
      if (!body) {
        return callback();
      }
      if (body === 'false') {
        return callback(false);
      }
      if (body === 'true') {
        return callback(true);
      }
      try {
        body = JSON.parse(body);
        if (
          !body ||
          !body.name ||
          !util.isString(body.key) ||
          !util.isString(body.cert)
        ) {
          return callback();
        }
        callback({
          key: body.key,
          cert: body.cert,
          name: body.name,
          mtime: body.mtime > 0 ? body.mtime : undefined
        });
      } catch (e) {
        callback(e);
      }
    });
  });
};

pluginMgr.on('update', function (result) {
  Object.keys(result).forEach(function (name) {
    pluginMgr.stopPlugin(result[name]);
  });
});
pluginMgr.on('uninstall', function (result) {
  Object.keys(result).forEach(function (name) {
    pluginMgr.stopPlugin(result[name]);
  });
});

function showVerbose(oldData, newData) {
  if (!debugMode) {
    return;
  }
  var uninstallData, installData, updateData;
  Object.keys(oldData).forEach(function (name) {
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

  Object.keys(newData).forEach(function (name) {
    if (!oldData[name]) {
      installData = installData || {};
      installData[name] = newData[name];
    }
  });

  uninstallData &&
    Object.keys(uninstallData).forEach(function (name) {
      console.log(
        colors.red(
          util.formatDate(new Date(uninstallData[name].mtime)) +
            ' [uninstall plugin] ' +
            name.slice(0, -1)
        )
      );
    });
  installData &&
    Object.keys(installData).forEach(function (name) {
      console.log(
        colors.green(
          util.formatDate(new Date(installData[name].mtime)) +
            ' [install plugin] ' +
            name.slice(0, -1)
        )
      );
    });
  updateData &&
    Object.keys(updateData).forEach(function (name) {
      console.log(
        colors.yellow(
          util.formatDate(new Date(updateData[name].mtime)) +
            ' [update plugin] ' +
            name.slice(0, -1)
        )
      );
    });
}

function readReqRules(dir, callback) {
  pluginUtil.readFile(path.join(path.join(dir, '_rules.txt')), function (err, rulesText) {
    if (err) {
      pluginUtil.readFile(
        path.join(path.join(dir, 'reqRules.txt')),
        function (_, rulesText) {
          callback(util.trim(rulesText));
        }
      );
      return;
    }
    callback(util.trim(rulesText));
  });
}

function readJson(pkgPath, callback) {
  fse.readJson(pkgPath, function (err, json) {
    if (!err) {
      return callback(err, json);
    }
    fse.readJson(pkgPath, callback);
  });
}

function readPackages(obj, callback) {
  var _plugins = {};
  var count = 0;
  var callbackHandler = function () {
    if (--count <= 0) {
      callback(_plugins);
    }
  };
  Object.keys(obj).forEach(function (name) {
    var pkg = allPlugins[name];
    var newPkg = obj[name];
    if (!pkg || pkg.path != newPkg.path || pkg.mtime != newPkg.mtime) {
      ++count;
      readJson(path.join(newPkg.path, 'package.json'), function (_, result) {
        if (result && result.version && pluginUtil.isPluginName(result.name)) {
          var conf = result.whistleConfig || '';
          var tabs = util.getInspectorTabs(conf);
          var hintList = util.getHintList(conf);
          var simpleName = name.slice(0, -1);
          newPkg.enableAuthUI = !!conf.enableAuthUI;
          newPkg.noOpt = !!(conf.noOption || conf.notOption);
          newPkg.updateUrl = util.getUpdateUrl(conf);
          newPkg.inheritAuth = !!conf.inheritAuth;
          newPkg.tunnelKey = util.getTunnelKey(conf);
          newPkg.version = result.version;
          newPkg.staticDir = util.getStaticDir(conf);
          newPkg.priority =
            parseInt(conf.priority, 10) ||
            parseInt(result.pluginPriority, 10) ||
            0;
          newPkg.rulesUrl = util.getCgiUrl(conf.rulesUrl);
          newPkg.valuesUrl = util.getCgiUrl(conf.valuesUrl);
          newPkg.networkMenus = util.getPluginMenu(
            conf.networkMenus || conf.networkMenu,
            simpleName
          );
          newPkg.rulesMenus = util.getPluginMenu(
            conf.rulesMenus || conf.rulesMenu,
            simpleName
          );
          newPkg.valuesMenus = util.getPluginMenu(
            conf.valuesMenus || conf.valuesMenu,
            simpleName
          );
          newPkg.reqTab = util.getCustomTab(tabs.req, simpleName);
          newPkg.resTab = util.getCustomTab(tabs.res, simpleName);
          newPkg.tab = util.getCustomTab(tabs, simpleName);
          newPkg.toolTab = util.getCustomTab(conf.toolsTab || conf.toolTab, simpleName);
          newPkg.comTab = util.getCustomTab(conf.composerTab, simpleName);
          newPkg[util.PLUGIN_MENU_CONFIG] = util.getPluginMenuConfig(conf);
          newPkg[util.PLUGIN_INSPECTOR_CONFIG] =
            util.getPluginInspectorConfig(conf);
          newPkg.hintUrl = hintList ? undefined : util.getCgiUrl(conf.hintUrl);
          newPkg.hintList = hintList;
          newPkg.pluginVars = util.getPluginVarsConf(conf);
          newPkg.hideShortProtocol = !!conf.hideShortProtocol;
          newPkg.hideLongProtocol = !!conf.hideLongProtocol;
          newPkg.homepage = pluginUtil.getHomePageFromPackage(result);
          newPkg.description = result.description;
          newPkg.moduleName = result.name;
          newPkg.pluginHomepage = pluginUtil.getPluginHomepage(result);
          newPkg.openInPlugins = conf.openInPlugins ? 1 : undefined;
          newPkg.registry = util.getRegistry(result);
          newPkg.latest = pkg && pkg.latest;
          _plugins[name] = newPkg;
          pluginUtil.readFile(
            path.join(path.join(newPkg.path, 'rules.txt')),
            function (err, rulesText) {
              newPkg.rules = util.renderPluginRules(
                util.trim(rulesText),
                result,
                simpleName
              );
              readReqRules(newPkg.path, function (rulesText) {
                newPkg._rules = util.renderPluginRules(
                  util.trim(rulesText),
                  result,
                  simpleName
                );
                pluginUtil.readFile(
                  path.join(path.join(newPkg.path, '_values.txt')),
                  function (err, rulesText) {
                    newPkg[util.PLUGIN_VALUES] = pluginUtil.parseValues(
                      util.renderPluginRules(rulesText, result, simpleName)
                    );
                    pluginUtil.readFile(
                      path.join(path.join(newPkg.path, 'resRules.txt')),
                      function (err, rulesText) {
                        newPkg.resRules = util.renderPluginRules(
                          util.trim(rulesText),
                          result,
                          simpleName
                        );
                        callbackHandler();
                      }
                    );
                  }
                );
              });
            }
          );
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
  while (name) {
    if ((plugin = allPlugins[name]) && !plugin.isProj) {
      break;
    }
    name = pluginNames.shift();
  }
  if (name) {
    util.getLatestVersion(plugin, function (ver) {
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
  !config.inspectMode &&
    setTimeout(function () {
      getPlugin(function (result) {
        readPackages(result, function (_plugins) {
          var updatePlugins, uninstallPlugins;
          var pluginNames = Object.keys(allPlugins);
          pluginNames.forEach(function (name) {
            var plugin = allPlugins[name];
            var newPlugin = _plugins[name];
            if (!newPlugin) {
              uninstallPlugins = uninstallPlugins || {};
              uninstallPlugins[name] = plugin;
            } else if (
              newPlugin.path != plugin.path ||
              newPlugin.mtime != plugin.mtime
            ) {
              updatePlugins = updatePlugins || {};
              updatePlugins[name] = newPlugin;
            }
          });
          showVerbose(allPlugins, _plugins);
          allPlugins = _plugins;
          if (
            uninstallPlugins ||
            updatePlugins ||
            Object.keys(_plugins).length !== pluginNames.length
          ) {
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
  value += rule.port ? ':' + rule.port : '';
  return encodeURIComponent(value);
}

function addRealUrl(req, newHeaders) {
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

function getPluginVars(value) {
  if (value) {
    try {
      value = JSON.stringify(value);
      return Buffer.from(value).toString('base64');
    } catch (e) {}
  }
}

function addPluginVars(req, headers, rule) {
  addRealUrl(req, headers);
  if (!rule) {
    delete headers[RULE_VALUE_HEADER];
    delete headers[GLOBAL_PLUGIN_VARS_HEAD];
    delete headers[PLUGIN_VARS_HEAD];
    return;
  }
  var plugin = rule.plugin;
  var name;
  var value;
  if (plugin) {
    name = plugin.moduleName.split('.', 2)[1];
    value = rule.value;
  } else {
    name = rule.matcher.split(':', 1)[0];
    value = util.getMatcherValue(rule);
  }
  if (value) {
    headers[RULE_VALUE_HEADER] = encodeURIComponent(value);
  } else {
    delete headers[RULE_VALUE_HEADER];
  }
  if (rule.rawPattern) {
    headers['x-whistle-raw-pattern_'] = encodeURIComponent((rule.isRegExp ? 1 : 0) + ',' + rule.rawPattern);
  }
  if (rule.url) {
    var extraUrl = rule.url;
    if (value) {
      extraUrl = rule.url.substring(value.length);
    }
    if (extraUrl) {
      headers[EXTRA_URL_HEADER] = encodeURIComponent(extraUrl);
    }
  }
  value = getPluginVars(req._globalPluginVars && req._globalPluginVars[name]);
  if (value) {
    headers[GLOBAL_PLUGIN_VARS_HEAD] = value;
  } else {
    delete headers[GLOBAL_PLUGIN_VARS_HEAD];
  }
  value = getPluginVars(req._pluginVars && req._pluginVars[name]);
  if (value) {
    headers[PLUGIN_VARS_HEAD] = value;
  } else {
    delete headers[PLUGIN_VARS_HEAD];
  }
}

function addPluginHeaders(req, headers, isKey) {
  if (req.reqId) {
    headers[REQ_ID_HEADER] = req.reqId;
  }
  if (req.fullUrl) {
    headers[FULL_URL_HEADER] = encodeURIComponent(req.fullUrl);
  }
  var clientIp = req.clientIp || util.getClientIp(req);
  if (clientIp) {
    headers[config.CLIENT_IP_HEAD] = clientIp;
  }
  var clientPort = req.clientPort || util.getClientPort(req);
  if (clientPort) {
    headers[config.CLIENT_PORT_HEAD] = clientPort;
  }
  if (req.fromTunnel) {
    headers[FROM_TUNNEL_HEADER] = '1';
  } else {
    delete headers[FROM_TUNNEL_HEADER];
  }
  headers[isKey ? 'x-whistle-remote-address' : config.REMOTE_ADDR_HEAD] = req._remoteAddr || LOCALHOST;
  headers[isKey ? 'x-whistle-remote-port' : config.REMOTE_PORT_HEAD] = req._remotePort || '0';
  if (req.fromComposer) {
    headers[config.REQ_FROM_HEADER] = 'W2COMPOSER';
  } else {
    delete headers[config.REQ_FROM_HEADER];
  }
  return headers;
}

function addRuleHeaders(req, rules, headers, isPipe) {
  headers = headers || req.headers;
  addPluginHeaders(req, headers);
  if (req._isUIRequest) {
    headers[UI_REQUEST_HEADER] = '1';
    return headers;
  }
  rules = rules || '';
  var localHost = getValue(rules.host);
  if (localHost) {
    headers[LOCAL_HOST_HEADER] = localHost;
  }
  var rule = rules.rule;
  if (isPipe) {
    if (req._pipePlugin) {
      rule = rule || rulesMgr.resolveRule(req);
      var value;
      if (rule) {
        var name = req._pipePlugin.moduleName;
        name = name.substring(name.indexOf('.') + 1) + '://';
        if (rule.matcher.indexOf(name) === 0)
          value = util.getMatcherValue(rule);
      }
      rule = { plugin: req._pipePlugin, value: value };
    } else {
      rule = null;
    }
  }
  addPluginVars(req, headers, rule);
  var proxyRule = getValue(rules.proxy);
  if (proxyRule) {
    headers[PROXY_VALUE_HEADER] = proxyRule;
  }
  var pac = getValue(rules.pac);
  if (pac) {
    headers[PAC_VALUE_HEADER] = pac;
  }
  if (req._pipeValue) {
    headers[PIPE_VALUE_HEADER] = encodeURIComponent(req._pipeValue);
  }
  if (req.customParser) {
    headers[CUSTOM_PARSER_HEADER] = req.customParser;
  } else {
    delete headers[CUSTOM_CERT_HEADER];
  }
  if (req.globalValue) {
    headers[GLOBAL_VALUE_HEAD] = encodeURIComponent(req.globalValue);
  }
  return headers;
}

pluginMgr.addRuleHeaders = addRuleHeaders;

function loadPlugin(plugin, callback) {
  if (!plugin) {
    return callback(null, '');
  }
  var ports = plugin[portsField];
  if (ports) {
    return callback(null, ports);
  }
  util.getBoundIp(config.host, function (host) {
    conf.host = host || LOCALHOST;
    var moduleName = plugin.moduleName;
    var name = moduleName.substring(moduleName.indexOf('/') + 1);
    var isInline = config.inspectMode || process.env.PFORK_MODE === 'inline';
    p.fork(
      {
        data: config.getPluginData(moduleName),
        _inspect: config.inspectMode,
        name: moduleName,
        script: PLUGIN_MAIN,
        value: plugin.path,
        isDev: plugin.isDev,
        version: plugin.version,
        staticDir: plugin.staticDir,
        CUSTOM_CERT_HEADER: CUSTOM_CERT_HEADER,
        ENABLE_CAPTURE_HEADER: ENABLE_CAPTURE_HEADER,
        RULE_VALUE_HEADER: RULE_VALUE_HEADER,
        SNI_VALUE_HEADER: SNI_VALUE_HEADER,
        GLOBAL_PLUGIN_VARS_HEAD: GLOBAL_PLUGIN_VARS_HEAD,
        PLUGIN_VARS_HEAD: PLUGIN_VARS_HEAD,
        RULE_URL_HEADER: RULE_URL_HEADER,
        MAX_AGE_HEADER: MAX_AGE_HEADER,
        ETAG_HEADER: ETAG_HEADER,
        FULL_URL_HEADER: FULL_URL_HEADER,
        REAL_URL_HEADER: REAL_URL_HEADER,
        RELATIVE_URL_HEADER: RELATIVE_URL_HEADER,
        EXTRA_URL_HEADER: EXTRA_URL_HEADER,
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
        SHOW_LOGIN_BOX: SHOW_LOGIN_BOX,
        FROM_TUNNEL_HEADER: FROM_TUNNEL_HEADER,
        CLIENT_IP_HEADER: config.CLIENT_IP_HEAD,
        CLIENT_PORT_HEAD: CLIENT_PORT_HEAD,
        UI_REQUEST_HEADER: UI_REQUEST_HEADER,
        GLOBAL_VALUE_HEAD: GLOBAL_VALUE_HEAD,
        SERVER_NAME_HEAD: SERVER_NAME_HEAD,
        COMMON_NAME_HEAD: COMMON_NAME_HEAD,
        CERT_CACHE_INFO: CERT_CACHE_INFO,
        HOST_IP_HEADER: HOST_IP_HEADER,
        debugMode: debugMode,
        config: isInline ? extend(true, {}, conf) : conf // 防止 inline 时，子进程删除 conf
      },
      function (err, ports, child, first) {
        callback(err, ports);
        if (!first) {
          return;
        }
        if (err) {
          whistleProxy.emit('pluginLoadError', err, name, moduleName);
          logger.error(err);
          var mode = process.env.PFORK_MODE;
          if (debugMode || mode === 'inline' || mode === 'bind') {
            console.log(err);
          }
        } else {
          whistleProxy.emit('pluginLoad', child, name, moduleName);
          plugin[portsField] = ports;
          child.on('close', function () {
            delete plugin[portsField];
          });
        }
      }
    );
  });
}

pluginMgr.loadPlugin = loadPlugin;

pluginMgr.loadPluginByName = function (name, callback) {
  loadPlugin(getActivePluginByName(name), callback);
};

pluginMgr.stopPlugin = function (plugin) {
  p.kill(
    {
      script: PLUGIN_MAIN,
      value: plugin.path
    },
    10000
  );
};

pluginMgr.getPlugins = function () {
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

function getActivePluginByName(name) {
  return pluginIsDisabled(name) ? null : allPlugins[name + ':'];
}

rulesMgr.getPlugin = getActivePluginByName;

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

function _loadPlugins(plugins, callback) {
  var rest = plugins.length;
  var results = [];
  var execCallback = function () {
    --rest === 0 && callback(results);
  };
  plugins.forEach(function (plugin, i) {
    loadPlugin(plugin, function (err, ports) {
      plugin.ports = ports;
      results[i] = ports || null;
      execCallback();
    });
  });
}

function loadPlugins(plugins, callback) {
  plugins = plugins.map(function (plugin) {
    return plugin.plugin;
  });
  _loadPlugins(plugins, callback);
}

pluginMgr.loadAuthPlugins = function (req, callback) {
  if (!authPlugins.length) {
    return callback();
  }
  req._isUIRequest = true;
  _loadPlugins(authPlugins, function (ports) {
    ports = ports.map(function (port, i) {
      return {
        authPort: port && port.authPort,
        plugin: authPlugins[i]
      };
    });
    var rest = ports.length;
    if (!rest) {
      return callback();
    }
    var options = getOptions(req);
    authReq(true, ports, req, options, function (forbidden) {
      if (!config.disableAuthUI && forbidden) {
        if (req._redirectUrl || req._authHtmlUrl) {
          return callback(req._redirectUrl, null, req._authHtmlUrl);
        }
        var status = req._authStatus ? (req._showLoginBox ? 401 : 403) : 502;
        return callback(status, forbidden);
      }
      return callback();
    });
  });
};

function parseRulesList(req, results, isResRules) {
  var values = {};
  results = results.filter(emptyFilter);
  results.reverse().forEach(function (item) {
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

function getPluginReqOpts(item, req, options, port) {
  var opts = extend({}, options);
  opts.headers = extend({}, options.headers);
  opts.port = port;
  addPluginVars(req, opts.headers, item);
  return opts;
}

function authReq(isReq, ports, req, options, callback) {
  if (!isReq) {
    return callback();
  }
  var rest = ports.length;
  var forbidden;
  var execCallback = function () {
    if (--rest === 0) {
      callback(forbidden);
    }
  };
  ports.forEach(function (item) {
    if (!item.authPort) {
      return execCallback();
    }
    options.headers[PLUGIN_HOOK_NAME_HEADER] = PLUGIN_HOOKS.AUTH;
    var opts = getPluginReqOpts(item, req, options, item.authPort);
    opts.maxLength = MAX_RULES_LENGTH;
    requestPlugin(opts, function (err, body, res) {
      var headers = res && res.headers;
      if (err || body) {
        if (!forbidden) {
          if (debugMode) {
            forbidden = err ? err.message || 'Error' : body;
          } else {
            forbidden = err ? 'Error' : body;
          }
          if (headers) {
            var authHtmlUrl = headers['x-auth-html-url'];
            req._authStatus = headers['x-auth-status'];
            if (authHtmlUrl) {
              try {
                authHtmlUrl = decodeURIComponent(authHtmlUrl);
                req._authHtmlUrl = HTTP_RE.test(authHtmlUrl)
                  ? authHtmlUrl
                  : 'file://' + authHtmlUrl;
              } catch (e) {}
            } else if (headers.location) {
              req._redirectUrl = headers.location;
            } else if (headers[SHOW_LOGIN_BOX]) {
              req._showLoginBox = true;
            }
          }
        }
        err && logger.error(err);
      }
      if (!forbidden && headers) {
        Object.keys(headers).forEach(function (key) {
          if (
            key.indexOf('x-whistle-') === 0 ||
            key === 'proxy-authorization'
          ) {
            var value = headers[key];
            if (key === config.WHISTLE_POLICY_HEADER &&
              value === 'enableCaptureByAuth') {
              req._forceCapture = true;
            } else if (key === config.CLIENT_ID_HEAD) {
              req._customClientId = value;
            }
            req.headers[key] = value;
            options.headers[key] = value;
          }
        });
      }
      execCallback();
    });
  });
}

function getRulesFromPlugins(type, req, res, callback) {
  var plugins = req.whistlePlugins;
  loadPlugins(plugins, function (ports) {
    ports = ports.map(function (port, i) {
      var plugin = plugins[i];
      return {
        port: port && port[type + 'Port'],
        authPort: port && port.authPort,
        plugin: plugin.plugin,
        isRegExp: plugin.isRegExp,
        rawPattern: plugin.rawPattern,
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
    var enableAuth =
      !isResRules &&
      req.justAuth !== false &&
      (!req.isPluginReq || req._isProxyReq) &&
      (!req.fromTunnel || !util.isAuthCapture(req));
    authReq(enableAuth, ports, req, options, function (forbidden) {
      if (forbidden) {
        var noTunnel = !req.isTunnel;
        req._authForbidden = true;
        var mgr = new RulesMgr({ msg: forbidden });
        if (noTunnel && req._authHtmlUrl) {
          mgr.parse(
            '* ignore://!method|!file|!http|!https method://get ' +
              req._authHtmlUrl
          );
        } else if (noTunnel && req._redirectUrl) {
          mgr.parse('* ignore://!redirect redirect://' + req._redirectUrl);
        } else {
          var status = req._authStatus ? (req._showLoginBox ? 401 : 403) : 502;
          mgr.parse(
            '* ignore://!statusCode|!resBody|!resType|!resCharset status://' +
              status +
              ' resBody://{msg} resType://html resCharset://utf8'
          );
        }
        return callback(mgr);
      }
      if (req.justAuth) {
        return callback();
      }
      var hookName = isResRules
        ? 'RES_RULES'
        : type === 'tunnelRules'
        ? 'TUNNEL_RULES'
        : 'REQ_RULES';
      options.headers[PLUGIN_HOOK_NAME_HEADER] = PLUGIN_HOOKS[hookName];
      var execCallback = function () {
        if (--rest <= 0) {
          if (req.resScriptRules) {
            results = results.concat(req.resScriptRules);
          }
          callback(parseRulesList(req, results, isResRules));
        }
      };
      ports.forEach(function (item, i) {
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

        var opts = getPluginReqOpts(item, req, options, item.port);
        var cacheKey = plugin.moduleName + '\n' + type;
        var data = rulesCache.get(cacheKey);
        var updateMaxAge = function (obj, age) {
          if (age >= 0) {
            obj.maxAge = age;
            obj.now = Date.now();
          }
        };
        var handleRules = function (err, body, values, raw, res) {
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
            pendingCallbacks.forEach(function (cb) {
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
  });
}

function getOptions(req, res, type, isPipe) {
  var fullUrl = req.fullUrl || util.getFullUrl(req);
  var options = util.parseUrl(fullUrl);
  var isResRules = res && type === 'resRules';
  var headers = extend({}, isResRules ? res.headers : req.headers);
  delete headers.upgrade;
  delete headers.connection;

  options.headers = addRuleHeaders(req, req.rules, headers, isPipe);
  delete headers['content-length'];
  headers[METHOD_HEADER] = encodeURIComponent(req.method || 'GET');

  if (isResRules) {
    headers.host = req.headers.host;
    headers[HOST_IP_HEADER] = req.hostIp || LOCALHOST;
    headers[STATUS_CODE_HEADER] = encodeURIComponent(
      res.statusCode == null ? '' : res.statusCode
    );
    if (req.headers.cookie) {
      headers.cookie = req.headers.cookie;
    } else {
      delete headers.cookie;
    }
  }

  if (req.isPluginReq) {
    headers[PLUGIN_REQUEST_HEADER] = 1;
  }

  if (req._existsCustomCert) {
    headers[CUSTOM_CERT_HEADER] = 1;
  }
  if (req._enableCapture) {
    headers[ENABLE_CAPTURE_HEADER] = 1;
  }

  options.protocol = 'http:';
  options.host = LOCALHOST;
  options.hostname = null;
  options.agent = false;

  return options;
}

function requestPlugin(options, callback, retryCount) {
  retryCount = retryCount || 0;
  util.request(options, function (err, body, res) {
    if (err && retryCount < 5) {
      return requestPlugin(options, callback, ++retryCount);
    }
    if (res && res.statusCode == 304) {
      return callback(false, null, res);
    }
    callback(null, body && body.trim(), res);
  });
}

function requestRules(options, callback) {
  requestPlugin(options, function (err, body, res) {
    if (err === false) {
      return callback(false, null, null, null, res);
    }
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
    } catch (e) {}
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
  return function (pluginRules) {
    req.pluginRules = pluginRules;
    callback(pluginRules);
  };
}

function resolvePipePlugin(req, callback) {
  if (req._pipePlugin == null) {
    var pipe;
    var hRules = req.headerRulesMgr;
    if (config.multiEnv) {
      pipe = (hRules && hRules.resolvePipe(req)) || rulesMgr.resolvePipe(req);
    } else {
      pipe = rulesMgr.resolvePipe(req) || (hRules && hRules.resolvePipe(req));
    }
    var plugin;
    req._pipeRule = pipe;
    if (pipe && PIPE_PLUGIN_RE.test(pipe.matcher)) {
      req._pipeValue = RegExp.$2;
      plugin = _getPlugin(RegExp.$1 + ':');
    }
    req._pipePlugin = plugin || '';
  }
  loadPlugin(req._pipePlugin, function (_, ports) {
    req._pipePluginPorts = ports || '';
    callback(ports);
  });
}

pluginMgr.resolvePipePlugin = resolvePipePlugin;

function getPipe(type, hookName) {
  var isRes = type.toLowerCase().indexOf('res') !== -1;
  hookName = PLUGIN_HOOKS[hookName];
  return function (req, res, callback) {
    if (!isRes) {
      callback = res;
      res = null;
    }
    resolvePipePlugin(req, function (ports) {
      var port = ports && ports[type + 'Port'];
      if (!port || req._hasClosed || req._hasError) {
        return callback();
      }
      var options = getOptions(req, res, isRes && 'resRules', true);
      options.headers[PLUGIN_HOOK_NAME_HEADER] = hookName;
      options.headers['x-whistle-request-tunnel-ack'] = 1;
      if (req._isUpgrade) {
        options.headers[UPGRADE_HEADER] = 1;
      }
      options.proxyHost = LOCALHOST;
      options.proxyPort = port;
      delete options.headers[CUSTOM_PARSER_HEADER];
      if (req._websocketExtensions !== null) {
        if (req._websocketExtensions) {
          req.headers['sec-websocket-extensions'] = req._websocketExtensions;
        } else {
          delete req.headers['sec-websocket-extensions'];
        }
      }
      var client;
      var done;
      var handleConnect = function (socket, _res) {
        if (!done) {
          done = true;
          if (req._hasError) {
            return socket.destroy();
          }
          callback(socket);
        }
      };
      var destroy = function () {
        if (client) {
          client.destroy();
          client.socket && client.socket.destroy();
          client = null;
          handleConnect();
        }
      };
      var handleError = function (err) {
        if (client) {
          destroy();
          if (err) {
            debugMode && console.log(req._pipeRule.matcher, type);
            (res || req).emit('error', err);
          }
        }
      };
      client = config.connect(options, handleConnect);
      client.on('error', function () {
        if (client) {
          destroy();
          client = !req._hasError && config.connect(options, handleConnect);
          client && util.onSocketEnd(client, handleError);
        }
      });
      req.once('_closed', function() {
        handleConnect();
        destroy();
      });
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

pluginMgr.getWsPipe = function (req, res, callback) {
  req._websocketExtensions = res.headers['sec-websocket-extensions'] || '';
  getWsReqReadPipe(req, function (reqRead) {
    getWsReqWritePipe(req, function (reqWrite) {
      getWsResReadPipe(req, res, function (resReadStream) {
        getWsResWritePipe(req, res, function (resWriteStream) {
          callback(reqRead, reqWrite, resReadStream, resWriteStream);
        });
      });
    });
  });
};

pluginMgr.getTunnelPipe = function (req, res, callback) {
  getTunnelReqReadPipe(req, function (reqRead) {
    getTunnelReqWritePipe(req, function (reqWrite) {
      getTunnelResReadPipe(req, res, function (resRead) {
        getTunnelResWritePipe(req, res, function (resWrite) {
          callback(reqRead, reqWrite, resRead, resWrite);
        });
      });
    });
  });
};

pluginMgr.getRules = function (req, callback) {
  getRulesMgr('rules', req, null, getPluginRulesCallback(req, callback));
};

pluginMgr.getResRules = function (req, res, callback) {
  req.curUrl = req.fullUrl;
  if (!req.resHeaders && res) {
    req.resHeaders = res.headers;
  }
  var resRules = rulesMgr.resolveResRules(req, true);
  var pRules = req.pluginRules && req.pluginRules.resolveResRules(req, true);
  var fRules = req.rulesFileMgr && req.rulesFileMgr.resolveResRules(req, true);
  var hRules =
    req.headerRulesMgr && req.headerRulesMgr.resolveResRules(req, true);
  fRules && util.mergeRules(req, fRules, true);
  config.multiEnv && util.mergeRules(req, resRules, true);
  hRules && util.mergeRules(req, hRules, true);
  pRules && util.mergeRules(req, pRules, true);
  !config.multiEnv && util.mergeRules(req, resRules, true);
  var resScriptRules;
  var resHeaderRules = res.headers[config.RES_RULES_HEAD];
  if (resHeaderRules) {
    try {
      resHeaderRules = rulesToJson(decodeURIComponent(resHeaderRules));
      if (resHeaderRules) {
        resScriptRules = resScriptRules || [];
        resScriptRules.push(resHeaderRules);
      }
    } catch (e) {}
  }
  delete res.headers[config.RES_RULES_HEAD];
  rulesMgr.resolveResRulesFile(req, res, function (result) {
    if (result) {
      resScriptRules = resScriptRules || [];
      resScriptRules.push(result);
    }
    req.resScriptRules = resScriptRules;
    getRulesMgr('resRules', req, res, function (pluginRulesMgr) {
      if (!pluginRulesMgr && resScriptRules) {
        pluginRulesMgr = parseRulesList(req, resScriptRules, true);
      }
      req.resScriptRules = resScriptRules = null;
      callback(pluginRulesMgr);
    });
  });
};

pluginMgr.getTunnelRules = function (req, callback) {
  getRulesMgr('tunnelRules', req, null, getPluginRulesCallback(req, callback));
};

function postStats(req, res) {
  var plugins = req.whistlePlugins;
  var type = res ? '_postResStats' : '_postReqStats';
  if (!plugins || req.isPluginReq || req[type]) {
    return;
  }
  req[type] = true;
  loadPlugins(plugins, function (ports) {
    ports = ports
      .map(function (port, i) {
        var plugin = plugins[i];
        var statsPort = port && (res ? port.resStatsPort : port.statsPort);
        if (!statsPort) {
          return;
        }
        return {
          plugin: plugin.plugin,
          port: statsPort,
          value: plugin.value,
          url: plugin.url
        };
      })
      .filter(emptyFilter);

    if (!ports.length) {
      return;
    }
    var options = getOptions(req, res, 'resRules');
    options.headers[PLUGIN_HOOK_NAME_HEADER] =
      PLUGIN_HOOKS[res ? 'RES_STATS' : 'REQ_STATS'];
    ports.forEach(function (item) {
      var opts = extend({}, options);
      opts.headers = extend({}, options.headers);
      opts.port = item.port;
      addPluginVars(req, opts.headers, item);
      var request = http.request(opts, function (response) {
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
    return (
      plugin && {
        plugin: plugin,
        value: value,
        url: ruleUrl == value ? undefined : ruleUrl
      }
    );
  }
}

function resolveWhistlePlugins(req) {
  var rules = req.rules;
  var plugins = [];
  var plugin = (req.pluginMgr = getPluginByRuleUrl(
    util.rule.getUrl(rules.rule)
  ));
  if (plugin) {
    rules._pluginRule = rules.rule;
    var ruleValue = util.getMatcherValue(rules.rule);
    var ruleUrl = util.getUrlValue(rules.rule, true);
    plugins.push({
      plugin: plugin,
      value: ruleValue,
      isRegExp: rules.rule.isRegExp,
      rawPattern: rules.rule.rawPattern,
      url: ruleUrl == ruleValue ? undefined : ruleUrl
    });
  }
  if (rules.plugin) {
    var _plugins = [plugin];
    rules.plugin.list.forEach(function (rule) {
      var info = getPluginByPluginRule(rule);
      if (info && _plugins.indexOf(info.plugin) == -1) {
        info.isRegExp = rule.isRegExp;
        info.rawPattern = rule.rawPattern;
        _plugins.push(info.plugin);
        plugins.push(info);
      }
    });
  }
  if (plugins.length) {
    req.whistlePlugins = plugins;
  }
  return plugin;
}

pluginMgr.resolveWhistlePlugins = resolveWhistlePlugins;

pluginMgr.updatePluginRules = function (name) {
  name &&
    httpMgr.forceUpdate(
      'http://127.0.0.1:' + config.port + '/whistle.' + name + '/'
    );
};

pluginMgr.setProxy = function (p) {
  whistleProxy = p;
};

httpMgr.setPluginMgr(pluginMgr);

var PLUGIN_KEY_RE =/^\$(?:whistle\.)?([a-z\d_-]+)[/:]([\S\s]+)$/;
var MAX_VALUE_LEN = 1024 * 1024 * 16;
var MAX_URL_VAL_LEN = 1024 * 256;

function requestValue(options, callback, isBin) {
  options.needRawData = isBin;
  var handleCallback = function(err, body, res) {
    var code = res && res.statusCode;
    if (code != 200) {
      body = '';
      if (!err) {
        err = new Error('Error: response ' + code);
        err.code = code || 500;
      }
    }
    callback(body, err, res);
  };
  httpMgr.request(extend({}, options), function(err, body, res) {
    if (err) {
      return  httpMgr.request(options, handleCallback);
    }
    handleCallback(err, body, res);
  });
  return options;
}

pluginMgr.resolveKey = function(url, rule, req) {
  if (HTTP_RE.test(url)) {
    return {
      url: url,
      originalKey: url,
      maxLength: MAX_URL_VAL_LEN
    };
  }
  if (!PLUGIN_KEY_RE.test(url)) {
    return;
  }
  var name = RegExp.$1;
  var key = RegExp.$2;
  if (!getActivePluginByName(name)) {
    return;
  }
  var ruleName = protocols.getRuleProto(rule);
  var headers = extend({}, req && req.headers, config.pluginHeaders);
  if (req) {
    addPluginHeaders(req, headers, true);
    headers[METHOD_HEADER] = req.method ? encodeURIComponent(req.method) : 'GET';
    delete headers.upgrade;
    delete headers.connection;
    delete headers['content-length'];
  }
  if (ruleName) {
    headers['x-whistle-rule-proto'] = ruleName;
  }
  return {
    originalKey: url,
    pluginName: name,
    maxLength: MAX_VALUE_LEN,
    url: name + '/api/key/value?key=' + util.encodeURIComponent(key),
    headers: headers
  };
};

pluginMgr.requestText = function(options, callback) {
  return requestValue(options, callback);
};

pluginMgr.requestBin =function(options, callback) {
  return requestValue(options, callback, true);
};

util.setPluginMgr(pluginMgr);

module.exports = pluginMgr;
