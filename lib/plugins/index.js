var path = require('path');
var p = require('pfork');
var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var extend = require('util')._extend;
var config = require('../config');
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var PLUGIN_MAIN = path.join(__dirname, './load-plugin');
var plugins = getPluginsSync();
var PLUGIN_URL_RE = /^https?:\/\/([\da-z]+)\.local\.whistlejs\.com\//i;
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
				} else if (newPlugin.version != plugin.version) {
					updatePlugins = updatePlugins || {};
					updatePlugins[name] = newPlugin;
				}
			});
			extend(plugins, result);
			uninstallPlugins && pluginMgr.emit('uninstall', uninstallPlugins);
			updatePlugins && pluginMgr.emit('update', updatePlugins);
			update();
		});
	}, INTERVAL);
})();

pluginMgr.loadPlugin = function(pluginPath, callback) {
	p.fork({
		script: PLUGIN_MAIN,
		value: pluginPath
	}, callback);
};

pluginMgr.stopPlugin = function(pluginPath) {
	p.kill({
		script: PLUGIN_MAIN,
		value: pluginPath
	}, config.timeout);
};

pluginMgr.getPlugins = function() {
	return plugins;
};

pluginMgr.getPlugin = function(protocol) {
	return plugins[protocol];
};

pluginMgr.getPluginFromHomePage = function(url) {
	return PLUGIN_URL_RE.test(url) 
				&& plugins[RegExp.$1 + ':'];
};

module.exports = pluginMgr;