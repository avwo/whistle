var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var plugins = getPluginsSync();
var INTERVAL = 5000;

(function update() {
	setTimeout(function() {
		getPlugin(function(result) {
			update();
			//pluginMgr.emit('uninstall', result);
			//pluginMgr.emit('update', result);
			//pluginMgr.emit('install', result);
		});
	}, INTERVAL);
})();

pluginMgr.loadPlugin = function() {
	
};

pluginMgr.getPlugins = function() {
	return plugins;
};

module.exports = pluginMgr;