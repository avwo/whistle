var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var util = require('./util');
var paths = require('./module-paths').getPaths();
var localPluginPaths = util.getLocalPluginPaths();

function getPluginModules(dir, callback) {
	readPluginMoudles(dir, function(plugins) {
		
	});
}

function readPluginMoudles(dir, callback, plugins) {
	fs.readdir(dir, function(err, list) {
		plugins = plugins || {};
		if (err) {
			return callback(plugins);
		}
		
		var count = 0;
		var callbackHandler = function() {
			list.forEach(function(name) {
				if (!plugins[name]) {
					plugins[name] = path.join(dir, name);
				}
			});
			callback(plugins);
		};
		list = list.filter(function(name) {
			if (util.isWhistleModule(name)) {
				return true;
			}
			
			if (util.isOrgModule(name)) {
				try {
					var _dir = path.join(dir, name);
					++count;
					fs.readdir(_dir, function(err, list) {
						if (!err) {
							list.forEach(function(name) {
								if (!plugins[name] && util.isWhistleModule(name)) {
									plugins[name] = path.join(_dir, name);
								}
							});
						}
						
						if (--count <= 0) {
							callbackHandler();
						}
					});
				} catch(e) {}
			}
			
			return false;
		});
		
		if (!count) {
			callbackHandler();
		}
	});
}

function readLocalPluginModules(callback, plugins) {
	fse.readJson(localPluginPaths, function(err, modules) {
		plugins = plugins || {};
		if (modules) {
			Object.keys(modules).forEach(function(name) {
				if (util.isWhistleModule(name)) {
					plugins[name] = modules[name];
				}
			});
		}
		callback(plugins);
	});
}

module.exports = function(callback) {
	var plugins = {};
	readLocalPluginModules(function() {
		var result = {};
		var count = paths.length;
		if (!count) {
			return callback(result);
		}
		var callbackHandler = function() {
			if (--count <= 0) {
				callback(result);
			}
		};
		paths.forEach(function(dir) {
			readPluginMoudles(dir, function() {
				var list = Object.keys(plugins);
				var len = list.length;
				list.forEach(function(name) {
					var dir = plugins[name];
					fse.readJson(path.join(dir, 'package.json'), function(err, pkg) {
						if (pkg && pkg.version) {
							result[name] = {
									path: dir,
									version: pkg.version,
									homepage: util.getHomePageFromPackage(pkg)
							};
						}
						if (--len <= 0) {
							callbackHandler();
						}
					});
				});
				
				if (!len) {
					callbackHandler();
				}
			}, plugins);
		});
	}, plugins);
};

