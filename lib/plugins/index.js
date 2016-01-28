var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var extend = require('util')._extend;
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var plugins = getPluginsSync();
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

pluginMgr.loadPlugin = function() {
	
};

pluginMgr.getPlugins = function() {
	return plugins;
};

module.exports = pluginMgr;