var cp = require('child_process');
var path = require('path');

module.exports = function init(app) {
	var util = app.rulesUtil;
	var pid = util.getProperty('tianmaChildPid');
	if (pid) {
		try {
			process.kill(pid);
		} catch(e) {}
	}
	
	var config = app.util.config;
	var child = cp.spawn('node', [path.join(__dirname, 'tianma.js'), config.tianmaport, config.tianmasslport], 
	                              {stdio: [ 0, 1, 2 ]});
	util.setProperty('tianmaChildPid', child.pid);
};