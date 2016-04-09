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
var colors = require('colors/safe');
var PLUGIN_MAIN = path.join(__dirname, './load-plugin');
var PLUGIN_URL_RE = /^(?:http|ws)s?:\/\/([\da-z]+)\.local\.whistlejs\.com\//i;
var RULE_VALUE_HEADER = 'x-whistle-rule-value';
var SSL_FLAG_HEADER = 'x-whistle-https';
var INTERVAL = 6000;
var UTF8_OPTIONS = {encoding: 'utf8'};
var plugins = getPluginsSync();
var rules = plugins.rules;
plugins = plugins.plugins;

function showVerbose(tag, oldData, newData) {
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
	
	if (uninstallData || installData || updateData) {
		console.log('\n***********[%s] %s has changed***********', comUtil.formatDate(), tag);
	}
	
	uninstallData && Object.keys(uninstallData).forEach(function(name) {
		console.log('[%s] [uninstall %s] %s', comUtil.formatDate(new Date(uninstallData[name].mtime)), tag, name.slice(0, -1));
	});
	installData && Object.keys(installData).forEach(function(name) {
		console.log('[%s] [install %s] %s', comUtil.formatDate(new Date(installData[name].mtime)), tag, name.slice(0, -1));
	});
	updateData && Object.keys(updateData).forEach(function(name) {
		console.log('[%s] [update %s] %s', comUtil.formatDate(new Date(updateData[name].mtime)), tag, name.slice(0, -1));
	});
}

function readPackages(obj, callback) {
	var _plugins = {};
	var _rules = {};
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
					var pureRules = !!pkg.pureRules;
					newPkg.pureRules = pureRules;
					if (!pureRules) {
						_plugins[name] = newPkg;
					}
					fs.readFile(path.join(path.join(newPkg.path, 'rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
						rulesText = comUtil.trim(rulesText);
						newPkg.rules = rulesText;
						if (rulesText) {
							_rules[name] = newPkg;
						}
						fs.readFile(path.join(path.join(newPkg.path, '_rules.txt')), UTF8_OPTIONS, function(err, rulesText) {
							newPkg._rules = comUtil.trim(rulesText);
							if (--count <= 0) {
								callback(_plugins, _rules);
							}
						});
					});
				}
				
			});
			
		} else {
			if (pkg.pureRules || pkg.rules) {
				_rules[name] = pkg;
			}
			
			if (!pkg.pureRules) {
				_plugins[name] = pkg;
			}
		}
	});
	
	if (count <= 0) {
		callback(_plugins, _rules);
	}
}

(function update() {
	setTimeout(function() {
		getPlugin(function(result) {
			readPackages(result, function(_plugins, _rules) {
				var hasUpdateRules;
				var rulesKeys = Object.keys(rules);
				var _rulesKeys = Object.keys(_rules);
				hasUpdateRules = rulesKeys.length != _rulesKeys.length;
				
				if (!hasUpdateRules) {
					for (var i = 0, len = rulesKeys.length; i < len; i++) {
						var name = rulesKeys[i];
						var rule = rules[name];
						var _rule = _rules[name];
						if (!rule || !_rule || rule.rules != _rule.rules) {
							hasUpdateRules = true;
							break;
						}
					}
				}
				
				showVerbose('rules', rules, _rules);
				rules = _rules;
				hasUpdateRules && pluginMgr.emit('updateRules', rules);
				
				var updatePlugins, uninstallPlugins;
				Object.keys(plugins).forEach(function(name) {
					var plugin = plugins[name];
					var newPlugin = _plugins[name];
					if (!newPlugin) {
						uninstallPlugins = uninstallPlugins || {};
						uninstallPlugins[name] = plugin;
					} else if (newPlugin.path != plugin.path || newPlugin.mtime != plugin.mtime) {
						updatePlugins = updatePlugins || {};
						updatePlugins[name] = newPlugin;
					}
				});
				showVerbose('plugins', plugins, _plugins);
				plugins = _plugins;
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

pluginMgr.getRules = function() {
	return rules;
};

module.exports = pluginMgr;