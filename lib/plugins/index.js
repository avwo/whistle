var path = require('path');
var p = require('pfork');
var fse = require('fs-extra');
var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var extend = require('util')._extend;
var util = require('./util');
var config = require('../config');
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var PLUGIN_MAIN = path.join(__dirname, './load-plugin');
var plugins = getPluginsSync();
var PLUGIN_URL_RE = /^(?:http|ws)s?:\/\/([\da-z]+)\.local\.whistlejs\.com\//i;
var RULE_VALUE_HEADER = 'x-whistle-rule-value';
var SSL_FLAG_HEADER = 'x-whistle-https';
var INTERVAL = 6000;

(function update() {
	setTimeout(function() {
		getPlugin(function(result) {
			var updatePlugins, uninstallPlugins;
			Object.keys(plugins).forEach(function(name) {
				var plugin = plugins[name];
				var newPlugin = result[name];
				if (!newPlugin) {
					delete plugins[name];
					uninstallPlugins = uninstallPlugins || {};
					uninstallPlugins[name] = plugin;
				} else if (newPlugin.path != plugin.path || newPlugin.mtime != plugin.mtime) {
					updatePlugins = updatePlugins || {};
					updatePlugins[name] = newPlugin;
				} else {
					result[name] = plugin;
				}
			});
			
			var hasUpdate;
			var count = 0;
			Object.keys(result).forEach(function(name) {
				var plugin = result[name];
				if (plugin.version) {
					return;
				}
				hasUpdate = true;
				++count;
				fse.readJson(plugin.pkgPath, function(err, pkg) {
					if (pkg && pkg.version) {
						plugin.version = pkg.version;
						plugin.homepage = util.getHomePageFromPackage(pkg);
					}
					if (--count <= 0) {
						notifyUpdate();
					}
				});
			});
			
			if (!hasUpdate) {
				notifyUpdate();
			}
			
			function notifyUpdate() {
				extend(plugins, result);
				uninstallPlugins && pluginMgr.emit('uninstall', uninstallPlugins);
				updatePlugins && pluginMgr.emit('update', updatePlugins);
				update();
			}
		});
	}, INTERVAL);
})();

pluginMgr.RULE_VALUE_HEADER = RULE_VALUE_HEADER;
pluginMgr.SSL_FLAG_HEADER = SSL_FLAG_HEADER;

pluginMgr.loadPlugin = function(plugin, callback) {
	p.fork({
		script: PLUGIN_MAIN,
		value: plugin.path,
		RULE_VALUE_HEADER: RULE_VALUE_HEADER,
		SSL_FLAG_HEADER: SSL_FLAG_HEADER
	}, callback);
};

pluginMgr.stopPlugin = function(plugin) {
	p.kill({
		script: PLUGIN_MAIN,
		value: plugin.path
	}, config.timeout);
};

pluginMgr.getPlugins = function() {
	return plugins;
};

pluginMgr.getPlugin = function(protocol) {
	return plugins[protocol];
};

pluginMgr.getPluginByRuleUrl = function(ruleUrl) {
	if (!ruleUrl || typeof ruleUrl != 'string') {
		return;
	}
	var index = ruleUrl.indexOf(':');
	return index == -1 ? null : plugins[ruleUrl.substring(0, index + 1)];
};

pluginMgr.getPluginByHomePage = function(url) {
	return PLUGIN_URL_RE.test(url) 
				&& plugins[RegExp.$1 + ':'];
};

module.exports = pluginMgr;