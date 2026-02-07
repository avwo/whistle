var path = require('path');
var fs = require('fs');
var util = require('../util');
var pluginUtil = require('./util');
var mp = require('./module-paths');
var config = require('../config');
var common = require('../util/common');

var CUSTOM_PLUGIN_PATH = config.CUSTOM_PLUGIN_PATH;
var customPluginPaths = config.customPluginPaths || [];
var notUninstallPluginPaths = config.notUninstallPluginPaths || [];
var projectPluginPaths = config.projectPluginPaths || [];
var accountPluginsPath = config.accountPluginsPath || [];
var paths = mp.getPaths();

function getMTimeSync(filePath) {
  var stats = common.getStatSync(filePath);
  return stats &&stats.isFile() ? stats.mtime.getTime() : null;
}

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
            if (pluginUtil.isWhistleModule(name)) {
              var root = isSys ? pluginUtil.getSysPathSync(_dir, name, org) : path.join(_dir, name);
              var mtime = getMTimeSync(path.join(root, 'package.json'));
              if (mtime != null) {
                var old = plugins[name];
                if (!old || (mtime > old.mtime && root === old.root)) {
                  plugins[name] = {
                    mtime: mtime,
                    root: root,
                    account: account,
                    dir: config.whistleName,
                    isSys: isSys,
                    notUn: notUn,
                    isProj: isProj
                  };
                }
              }
            }
          });
        } catch (e) {}
      }
      return false;
    });

    list.forEach(function (name) {
      var root = isSys ? pluginUtil.getSysPathSync(dir, name) : path.join(dir, name);
      var mtime = getMTimeSync(path.join(root, 'package.json'));
      if (mtime != null) {
        var old = plugins[name];
        if (!old || (mtime > old.mtime && root === old.root)) {
          plugins[name] = {
            root: root,
            mtime: mtime,
            account: account,
            dir: config.whistleName,
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
    var simpleName = pluginUtil.getPluginName(name);
    if (pluginUtil.excludePlugin(simpleName)) {
      return;
    }
    var dir = plugins[name];
    var account = dir.account;
    var isSys = dir.isSys;
    var isProj = dir.isProj;
    var notUn = dir.notUn;
    var isDev = dir.isDev;
    var dirName = dir.dir;
    var mtime = dir.mtime;
    dir = dir.root;
    var pkgPath = path.join(dir, 'package.json');
    var pkg = common.readJsonSync(pkgPath);
    if (!pkg) {
      return;
    }
    if (!pkg.version || !pluginUtil.isPluginName(pkg.name)) {
      try {
        fs.renameSync(pkgPath, pkgPath + '.' + Date.now());
      } catch (e) {}
      return;
    }
    try {
      var conf = pkg.whistleConfig || '';
      var tabs = util.getInspectorTabs(conf);
      var hintList = util.getHintList(conf);
      var plugin = {
        account: account,
        dir: dirName,
        isSys: isSys,
        isDev: isDev,
        isProj: isProj,
        noOpt: !!(conf.noOption || conf.notOption || conf.disableOption|| conf.disabledOption),
        notUn: notUn,
        moduleName: pkg.name,
        enableAuthUI: !!conf.enableAuthUI,
        inheritAuth: !!conf.inheritAuth,
        updateUrl: util.getUpdateUrl(conf),
        tunnelKey: util.getTunnelKey(conf),
        staticDir: util.getStaticDir(conf),
        pluginVars: util.getPluginVarsConf(conf),
        networkColumn: util.getNetworkColumn(conf),
        webWorker: pluginUtil.readWorkerSync(dir, conf, simpleName),
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
        pluginsMenus:  util.getPluginMenu(
            conf.pluginsMenus || conf.pluginsMenu,
            simpleName
          ),
        reqTab: util.getCustomTab(tabs.req, simpleName),
        resTab: util.getCustomTab(tabs.res, simpleName),
        tab: util.getCustomTab(tabs, simpleName),
        toolTab: util.getCustomTab(conf.toolsTab || conf.toolTab, simpleName),
        comTab: util.getCustomTab(conf.composerTab, simpleName),
        pluginHomepage: pluginUtil.getPluginHomepage(pkg) || pluginUtil.getPluginHomepage(conf),
        openInPlugins: conf.openInPlugins ? 1 : undefined,
        openInModal: util.getPluginModal(conf),
        openExternal: conf.openExternal ? 1 : undefined,
        priority: parseInt(conf.priority, 10) || parseInt(pkg.pluginPriority, 10) || 0,
        rulesUrl: util.getCgiUrl(conf.rulesUrl),
        valuesUrl: util.getCgiUrl(conf.valuesUrl),
        installUrl: util.getCgiUrl(conf.installUrl),
        favicon: util.getCgiUrl(conf.favicon),
        installRegistry: util.getInstallRegistry(conf.installRegistry),
        hintUrl: hintList ? undefined : util.getCgiUrl(conf.hintUrl),
        hideShortProtocol: !!conf.hideShortProtocol,
        hideLongProtocol: !!conf.hideLongProtocol,
        hintList: hintList,
        registry: util.getRegistry(pkg),
        path: dir,
        mtime: mtime,
        version: pkg.version,
        description: pkg.description,
        homepage: pluginUtil.getHomePageFromPackage(pkg) || pluginUtil.getHomePageFromPackage(conf),
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
          ), simpleName);
      plugin[util.PLUGIN_MENU_CONFIG] = util.getPluginMenuConfig(conf);
      plugin[util.PLUGIN_INSPECTOR_CONFIG] =
          util.getPluginInspectorConfig(conf);
      _plugins[simpleName + ':'] = plugin;

    } catch (e) {}
  });

  return _plugins;
};
