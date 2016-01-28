var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var plugins = getPluginsSync();
var INTERVAL = 5000;

(function update() {
	setTimeout(function() {
		getPlugin(function(result) {
			console.log(result);
			//pluginMgr.emit('uninstall', result);
			//pluginMgr.emit('update', result);
			//pluginMgr.emit('install', result);
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