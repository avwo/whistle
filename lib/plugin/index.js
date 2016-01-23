var cp = require('./child-process');

function loadPlugin(pluginPath, callback) {
	cp.fork({
		pluginPath: pluginPath
	}, callback);
}

exports.loadPlugin = loadPlugin;

