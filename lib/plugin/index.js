var cp = require('./child-process');

exports.fork = cp.fork;

function loadPlugin(pluginPath, ruleValue, callback) {
	cp.fork({
		main: pluginPath,
		ruleValue: ruleValue
	}, callback);
}

exports.loadPlugin = loadPlugin;

