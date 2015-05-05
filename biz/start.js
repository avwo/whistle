var cp = require('child_process');
var path = require('path');

module.exports = function start(util, name, argv) {
	var pid = util.getProperty(name);
	if (pid) {
		try {
			process.kill(pid);
		} catch(e) {}
	}
	
	var child = cp.spawn('node', argv, {stdio: [ 0, 1, 2 ]});
	util.setProperty(name, child.pid);
};