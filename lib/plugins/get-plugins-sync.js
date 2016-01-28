var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var util = require('./util');
var paths = require('./module-paths').getPaths();
var localPluginPaths = util.getLocalPluginPaths();

function readPluginMoudlesSync(dir, plugins) {
	plugins = plugins || {};
	try {
		var list = fs.readdirSync(dir).filter(function(name) {
			if (util.isWhistleModule(name)) {
				return true;
			}
			
			if (util.isOrgModule(name)) {
				try {
					var _dir = path.join(dir, name);
					fs.readdirSync(_dir).forEach(function(name) {
						if (!plugins[name] && util.isWhistleModule(name)) {
							plugins[name] = path.join(_dir, name);
						}
					});
				} catch(e) {}
			}
			return false;
		});
		
		list.forEach(function(name) {
			if (!plugins[name]) {
				plugins[name] = path.join(dir, name);
			}
		});
	} catch(e) {}
	
	return plugins;
}

function readLocalPluginModulesSync(plugins) {
	plugins = plugins || {};
	try {
		var modules = fse.readJsonSync(localPluginPaths);
		Object.keys(modules).forEach(function(name) {
			if (util.isWhistleModule(name)) {
				plugins[name] = modules[name];
			}
		});
	} catch(e) {}
	return plugins;
}

module.exports = function() {
	var plugins = readLocalPluginModulesSync();
	paths.forEach(function(dir) {
		readPluginMoudlesSync(dir, plugins);
	});
	
	var result = {};
	Object.keys(plugins).forEach(function(name) {
		var dir = plugins[name];
		try {
			var pkg = fse.readJsonSync(path.join(dir, 'package.json'));
			if (pkg && pkg.version) {
				result[name] = {
						path: dir,
						version: pkg.version,
						homepage: util.getHomePageFromPackage(pkg)
				};
			}
		} catch(e) {}
	});
	
	return result;
};

