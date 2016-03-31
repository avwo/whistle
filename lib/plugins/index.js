var path = require('path');
var p = require('pfork');
var fs = require('fs');
var fse = require('fs-extra');
var EventEmitter = require('events').EventEmitter;
var pluginMgr = new EventEmitter();
var extend = require('util')._extend;
var comUtil = require('../util');
var util = require('./util');
var config = require('../config');
var getPluginsSync = require('./get-plugins-sync');
var getPlugin = require('./get-plugins');
var PLUGIN_MAIN = path.join(__dirname, './load-plugin');
var plugins = getPluginsSync();
var rules = {};
var PLUGIN_URL_RE = /^(?:http|ws)s?:\/\/([\da-z]+)\.local\.whistlejs\.com\//i;
var RULE_VALUE_HEADER = 'x-whistle-rule-value';
var SSL_FLAG_HEADER = 'x-whistle-https';
var INTERVAL = 6000;
var UTF8_OPTIONS = {encoding: 'utf8'};

Object.keys(plugins).forEach(function(name) {
	var plugin = plugins[name];
	plugin.rules = comUtil.trim(comUtil.readFileSync(path.join(plugin.path, 'rules.txt')));
	plugin._rules = comUtil.trim(comUtil.readFileSync(path.join(plugin.path, '_rules.txt')));
	
	if (plugin.pureRules) {
		delete plugins[name];
	}
	if (plugin.rules) {
		rules[name] = plugin;
	}
});

function readPackages(obj, callback) {
	var result = {};
	var count = 0;
	Object.keys(obj).forEach(function(name) {
		var pkg = plugins[name] || rules[name];
		var newPkg = obj[name];
		if (!pkg || pkg.path != newPkg.path || pkg.mtime != newPkg.mtime) {
			++count;
			fse.readJson(newPkg.pkgPath, function(err, pkg) {
				if (pkg && pkg.version) {
					newPkg.version = pkg.version;
					newPkg.homepage = util.getHomePageFromPackage(pkg);
					newPkg.pureRules = !!pkg.pureRules;
					result[name] = newPkg;
					fs.readFile(path.join(path.join(newPkg.path, 'rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
						newPkg.rules = comUtil.trim(rulesText);
						fs.readFile(path.join(path.join(newPkg.path, '_rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
							newPkg._rules = comUtil.trim(rulesText);
							if (--count <= 0) {
								callback(result);
							}
						});
					});
				}
				
			});
			
		} else {
			result[name] = pkg;
		}
	});
	
	if (count <= 0) {
		callback(result);
	}
}

(function update() {
	setTimeout(function() {
		getPlugin(function(result) {
			readPackages(result, function(result) {
				rules = {};
				Object.keys(result).forEach(function(name) {
					var plugin = result[name];
					if (plugin.pureRules) {
						delete result[name];
					}
					if (plugin.rules) {
						rules[name] = plugin;
					}
				});
				
				var updatePlugins, uninstallPlugins;
				Object.keys(plugins).forEach(function(name) {
					var plugin = plugins[name];
					var newPlugin = result[name];
					if (!newPlugin) {
						uninstallPlugins = uninstallPlugins || {};
						uninstallPlugins[name] = plugin;
					} else if (newPlugin.path != plugin.path || newPlugin.mtime != plugin.mtime) {
						updatePlugins = updatePlugins || {};
						updatePlugins[name] = newPlugin;
					}
				});
				
				plugins = result;
				uninstallPlugins && pluginMgr.emit('uninstall', uninstallPlugins);
				updatePlugins && pluginMgr.emit('update', updatePlugins);
				update();
			});
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
	}, 10000);
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