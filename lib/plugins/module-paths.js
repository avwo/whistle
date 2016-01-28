var path = require('path');
var paths = module.paths;
var config = require('../config');
var LOCAL_PLUGIN_PATHS = path.join(config.getDataDir(), '../plugins.json');
var globalDir = getGlobalDir();
var appDataDir = process.env && process.env.APPDATA;

if (appDataDir) {
	paths.push(path.join(appDataDir, 'npm/node_modules'));
}

if (globalDir) {
	paths.push(globalDir);
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

exports.getLocalPluginPaths = function() {
	return LOCAL_PLUGIN_PATHS;
};

exports.getPaths = function() {
	return paths;
};

