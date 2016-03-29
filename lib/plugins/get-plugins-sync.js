var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var protocols = require('../rules/protocols');
var util = require('./util');
var mp = require('./module-paths');
var paths = mp.getPaths();

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

module.exports = function() {
	var plugins = {};
	paths.forEach(function(dir) {
		readPluginMoudlesSync(dir, plugins);
	});
	
	var result = {};
	Object.keys(plugins).forEach(function(name) {
		var simpleName = name.split('.')[1];
		if (protocols.contains(simpleName)) {
			return;
		}
		var dir = plugins[name];
		try {
			var pkgPath = path.join(dir, 'package.json');
			var pkg = fse.readJsonSync(pkgPath);
			if (pkg && pkg.version) {
				var stats = fs.statSync(pkgPath);
				result[simpleName + ':'] = {
						path: dir,
						pkgPath: pkgPath,
						mtime: stats.mtime.getTime(),
						version: pkg.version,
						homepage: util.getHomePageFromPackage(pkg)
				};
			}
		} catch(e) {}
	});
	
	return result;
};

