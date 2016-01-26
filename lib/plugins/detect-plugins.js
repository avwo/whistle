var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var paths = module.paths;
var config = require('../config');
var LOCAL_PLUGIN_PATHS = path.join(config.DATA_DIR, '.plugins.json');
var ORG_RE = /^@[\w\-]+/;
var WHISLTE_PLUGIN_RE = /^whistle\.[\da-z]+/i;
var globalDir = getGlobalDir();

if (globalDir) {
	paths.push(globalDir);
}

paths.forEach(function(dir) {
	console.log(getPluginModulesSync(dir));
});

paths.forEach(function(dir) {
	getPluginModules(dir, function(plugins) {
		console.log(plugins);
	});
});

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

function getGlobalDir() {
	var globalPrefix;
	if (process.env.PREFIX) {
	   globalPrefix = process.env.PREFIX
	} else if (process.platform === 'win32') {
	   globalPrefix = path.dirname(process.execPath)
	} else {
	   globalPrefix = path.dirname(path.dirname(process.execPath))
	   if (process.env.DESTDIR) {
	     globalPrefix = path.join(process.env.DESTDIR, globalPrefix)
	   }
	}
	if (typeof globalPrefix == 'string') {
		return (process.platform !== 'win32')
			        ? path.resolve(globalPrefix, 'lib', 'node_modules')
			        : path.resolve(globalPrefix, 'node_modules')
	}
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
			if (iswhistleModule(name)) {
				return true;
			}
			
			if (ORG_RE.test(name)) {
				try {
					var _dir = path.join(dir, name);
					++count;
					fs.readdir(_dir, function(err, list) {
						if (!err) {
							list.forEach(function(name) {
								if (!result[name] && iswhistleModule(name)) {
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

function readPluginMoudlesSync(dir) {
	var result = {};
	try {
		var list = fs.readdirSync(dir).filter(function(name) {
			if (iswhistleModule(name)) {
				return true;
			}
			
			if (ORG_RE.test(name)) {
				try {
					var _dir = path.join(dir, name);
					fs.readdirSync(_dir).forEach(function(name) {
						if (!result[name] && iswhistleModule(name)) {
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

function readLocalPluginModules(callback) {
	fse.readJson(LOCAL_PLUGIN_PATHS, function(err, modules) {
		var plugins = {};
		if (modules) {
			Object.keys(modules).forEach(function(name) {
				if (iswhistleModule(name)) {
					plugins[name] = modules[name];
				}
			});
		}
		callback(plugins);
	});
}

function readLocalPluginModulesSync() {
	var plugins = {};
	try {
		var modules = fse.readJsonSync(LOCAL_PLUGIN_PATHS);
		Object.keys(modules).forEach(function(name) {
			if (iswhistleModule(name)) {
				plugins[name] = modules[name];
			}
		});
	} catch(e) {}
	return plugins;
}

function iswhistleModule(dir) {
	return WHISLTE_PLUGIN_RE.test(dir);
}