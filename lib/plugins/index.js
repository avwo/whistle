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
var rules = plugins.rules;
var plugins = plugins.plugins;
var PLUGIN_URL_RE = /^(?:http|ws)s?:\/\/([\da-z]+)\.local\.whistlejs\.com\//i;
var RULE_VALUE_HEADER = 'x-whistle-rule-value';
var SSL_FLAG_HEADER = 'x-whistle-https';
var INTERVAL = 6000;
var UTF8_OPTIONS = {encoding: 'utf8'};

function readPackages(obj, callback) {
	var result = {};
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
						result[name] = newPkg;
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
								callback(result, _rules);
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
		callback(result, _rules);
	}
}

(function update() {
	setTimeout(function() {
		getPlugin(function(result) {
			readPackages(result, function(result, _rules) {
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
				
				rules = _rules;
				hasUpdateRules && pluginMgr.emit('updateRules', rules);
				
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

pluginMgr.getRules = function() {
	return rules;
};

module.exports = pluginMgr;