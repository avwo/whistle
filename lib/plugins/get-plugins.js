var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var mp = require('./module-paths');
var paths = mp.getPaths();
var localPluginPaths = mp.getLocalPluginPaths();

function getPluginModules(dir, callback) {
	readPluginMoudles(dir, function(result) {
		var list = Object.keys(result);
		var len = list.length;
		var plugins = {};
		list.forEach(function(name) {
			var dir = result[name];
			fse.readJson(path.join(dir, 'package.json'), function(err, pkg) {
				if (pkg && pkg.version) {
					plugins[name] = pkg.version;
				}
				if (--len <= 0) {
					callback(plugins);
				}
			});
		});
		
		if (!len) {
			callback(plugins);
		}
	});
}

function readPluginMoudles(dir, callback) {
	fs.readdir(dir, function(err, list) {
		var result = {};
		if (err) {
			return callback(result);
		}
		
		var count = 0;
		var execCallback = function() {
			list.forEach(function(name) {
				if (!result[name]) {
					result[name] = path.join(dir, name);
				}
			});
			callback(result);
		};
		list = list.filter(function(name) {
			if (mp.isWhistleModule(name)) {
				return true;
			}
			
			if (mp.isOrgModule(name)) {
				try {
					var _dir = path.join(dir, name);
					++count;
					fs.readdir(_dir, function(err, list) {
						if (!err) {
							list.forEach(function(name) {
								if (!result[name] && mp.isWhistleModule(name)) {
									result[name] = path.join(_dir, name);
								}
							});
						}
						
						if (--count <= 0) {
							execCallback();
						}
					});
				} catch(e) {}
			}
			
			return false;
		});
		
		if (!count) {
			execCallback();
		}
	});
}

function readLocalPluginModules(callback) {
	fse.readJson(localPluginPaths, function(err, modules) {
		var plugins = {};
		if (modules) {
			Object.keys(modules).forEach(function(name) {
				if (mp.isWhistleModule(name)) {
					plugins[name] = modules[name];
				}
			});
		}
		callback(plugins);
	});
}

module.exports = function() {
	//paths.forEach(function(dir) {
	//	getPluginModules(dir, function(plugins) {
	//		console.log(plugins);
	//	});
	//});
};

