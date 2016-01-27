var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var mp = require('./module-paths');
var paths = mp.getPaths();
var localPluginPaths = mp.getLocalPluginPaths();

function getPluginModulesSync(dir) {
	var result = readPluginMoudlesSync(dir);
	var plugins = {};
	Object.keys(result).forEach(function(name) {
		var dir = result[name];
		try {
			var pkg = fse.readJsonSync(path.join(dir, 'package.json'));
			if (pkg && pkg.version) {
				plugins[name] = pkg.version;
			}
		} catch(e) {}
	});
	
	return plugins;
}

function readPluginMoudlesSync(dir) {
	var result = {};
	try {
		var list = fs.readdirSync(dir).filter(function(name) {
			if (mp.isWhistleModule(name)) {
				return true;
			}
			
			if (mp.isOrgModule(name)) {
				try {
					var _dir = path.join(dir, name);
					fs.readdirSync(_dir).forEach(function(name) {
						if (!result[name] && mp.isWhistleModule(name)) {
							result[name] = path.join(_dir, name);
						}
					});
				} catch(e) {}
			}
			return false;
		});
		
		list.forEach(function(name) {
			if (!result[name]) {
				result[name] = path.join(dir, name);
			}
		});
	} catch(e) {}
	
	return result;
}

function readLocalPluginModulesSync() {
	var plugins = {};
	try {
		var modules = fse.readJsonSync(localPluginPaths);
		Object.keys(modules).forEach(function(name) {
			if (mp.isWhistleModule(name)) {
				plugins[name] = modules[name];
			}
		});
	} catch(e) {}
	return plugins;
}

module.exports = function() {
	paths.forEach(function(dir) {
		//console.log(getPluginModulesSync(dir));
	});
};

