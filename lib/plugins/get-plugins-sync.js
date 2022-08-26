var path = require('path');
var fs = require('fs');
var fse = require('fs-extra2');
var util = require('../util');
var pluginUtil = require('./util');
var mp = require('./module-paths');
var config = require('../config');

var CUSTOM_PLUGIN_PATH = config.CUSTOM_PLUGIN_PATH;
var customPluginPaths = config.customPluginPaths || [];
var notUninstallPluginPaths = config.notUninstallPluginPaths || [];
var projectPluginPaths = config.projectPluginPaths || [];
var accountPluginsPath = config.accountPluginsPath || [];
var paths = mp.getPaths();

function readPluginModulesSync(dir, plugins) {
  var isAccount = accountPluginsPath.indexOf(dir) !== -1;
  var account = isAccount ? config.account : undefined;
  var isSys = isAccount || CUSTOM_PLUGIN_PATH === dir || customPluginPaths.indexOf(dir) !== -1;
  var isProj = projectPluginPaths.indexOf(dir) !== -1;
  var notUn = notUninstallPluginPaths.indexOf(dir) !== -1;

  try {
    var list = fs.readdirSync(dir).filter(function (name) {
      if (pluginUtil.isWhistleModule(name)) {
        return true;
      }

      if (pluginUtil.isOrgModule(name)) {
        try {
          var _dir = path.join(dir, name);
          var org = name;
          fs.readdirSync(_dir).forEach(function (name) {
            if (!plugins[name] && pluginUtil.isWhistleModule(name)) {
              var root = isSys
                ? path.join(_dir, name, 'node_modules', org, name)
                : path.join(_dir, name);
              if (fs.existsSync(path.join(root, 'package.json'))) {
                plugins[name] = {
                  root: root,
                  account: account,
                  isSys: isSys,
                  notUn: notUn,
                  isProj: isProj
                };
              }
            }
          });
        } catch (e) {}
      }
      return false;
    });

    list.forEach(function (name) {
      if (!plugins[name]) {
        var root = isSys
          ? path.join(dir, name, 'node_modules', name)
          : path.join(dir, name);
        if (fs.existsSync(path.join(root, 'package.json'))) {
          plugins[name] = {
            root: root,
            account: account,
            isSys: isSys,
            notUn: notUn,
            isProj: isProj
          };
        }
      }
    });
  } catch (e) {}

  return plugins;
}

module.exports = function () {
  var plugins = pluginUtil.readDevPluginsSync();
  paths.forEach(function (dir) {
    readPluginModulesSync(dir, plugins);
  });

  var _plugins = {};
  Object.keys(plugins).forEach(function (name) {
    var simpleName = name.split('.', 2)[1];
    if (pluginUtil.excludePlugin(simpleName)) {
      return;
    }
    var dir = plugins[name];
    var account = dir.account;
    var isSys = dir.isSys;
    var isProj = dir.isProj;
    var notUn = dir.notUn;
    var isDev = dir.isDev;
    dir = dir.root;
    try {
      var pkgPath = path.join(dir, 'package.json');
      var pkg = fse.readJsonSync(pkgPath);
      if (pkg && pkg.version && pluginUtil.isPluginName(pkg.name)) {
        var stats = fs.statSync(pkgPath);
        var conf = pkg.whistleConfig || '';
        var tabs = util.getInspectorTabs(conf);
        var hintList = util.getHintList(conf);
        var plugin = {
          account: account,
          isSys: isSys,
          isDev: isDev,
          isProj: isProj,
          noOpt: !!(conf.noOption || conf.notOption),
          notUn: notUn,
          moduleName: pkg.name,
          enableAuthUI: !!conf.enableAuthUI,
          inheritAuth: !!conf.inheritAuth,
          updateUrl: util.getUpdateUrl(conf),
          tunnelKey: util.getTunnelKey(conf),
          staticDir: util.getStaticDir(conf),
          pluginVars: util.getPluginVarsConf(conf),
          networkMenus: util.getPluginMenu(
            conf.networkMenus || conf.networkMenu,
            simpleName
          ),
          rulesMenus: util.getPluginMenu(
            conf.rulesMenus || conf.rulesMenu,
            simpleName
          ),
          valuesMenus: util.getPluginMenu(
            conf.valuesMenus || conf.valuesMenu,
            simpleName
          ),
          reqTab: util.getCustomTab(tabs.req, simpleName),
          resTab: util.getCustomTab(tabs.res, simpleName),
          tab: util.getCustomTab(tabs, simpleName),
          toolTab: util.getCustomTab(conf.toolsTab || conf.toolTab, simpleName),
          comTab: util.getCustomTab(conf.composerTab, simpleName),
          pluginHomepage: pluginUtil.getPluginHomepage(pkg),
          openInPlugins: conf.openInPlugins ? 1 : undefined,
          priority:
            parseInt(conf.priority, 10) ||
            parseInt(pkg.pluginPriority, 10) ||
            0,
          rulesUrl: util.getCgiUrl(conf.rulesUrl),
          valuesUrl: util.getCgiUrl(conf.valuesUrl),
          hintUrl: hintList ? undefined : util.getCgiUrl(conf.hintUrl),
          hideShortProtocol: !!conf.hideShortProtocol,
          hideLongProtocol: !!conf.hideLongProtocol,
          hintList: hintList,
          registry: util.getRegistry(pkg),
          path: dir,
          mtime: stats.mtime.getTime(),
          version: pkg.version,
          description: pkg.description,
          homepage: pluginUtil.getHomePageFromPackage(pkg),
          rules: util.renderPluginRules(
            util.trim(util.readFileSync(path.join(dir, 'rules.txt'))),
            pkg,
            simpleName
          ),
          _rules: util.renderPluginRules(
            util.trim(util.readFileSync(path.join(dir, '_rules.txt'))) ||
              util.trim(util.readFileSync(path.join(dir, 'reqRules.txt'))),
            pkg,
            simpleName
          ),
          resRules: util.renderPluginRules(
            util.trim(util.readFileSync(path.join(dir, 'resRules.txt'))),
            pkg,
            simpleName
          )
        };

        plugin[util.PLUGIN_VALUES] = pluginUtil.parseValues(
          util.renderPluginRules(
            util.readFileSync(path.join(dir, '_values.txt')),
            pkg,
            simpleName
          )
        );
        plugin[util.PLUGIN_MENU_CONFIG] = util.getPluginMenuConfig(conf);
        plugin[util.PLUGIN_INSPECTOR_CONFIG] =
          util.getPluginInspectorConfig(conf);
        _plugins[simpleName + ':'] = plugin;
      }
    } catch (e) {}
  });

  return _plugins;
};
