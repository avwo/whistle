var path = require('path');
var paths = module.paths.map(formatPath);
var config = require('../config');
var LOCAL_PLUGIN_PATHS = path.join(config.getDataDir(), '../plugins.json');
var globalDir = formatPath(getGlobalDir());
var appDataDir = formatPath(process.env && process.env.APPDATA);

if (appDataDir && paths.indexOf(appDataDir) == -1) {
	paths.push(path.join(appDataDir, 'npm/node_modules'));
}

if (globalDir && paths.indexOf(globalDir) == -1) {
	paths.push(globalDir);
}

function formatPath(path) {
	return typeof path == 'string' ? path.replace(/\\/g, '/') : null;
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

