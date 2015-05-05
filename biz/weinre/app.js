var cp = require('child_process');
var path = require('path');

module.exports = function init(app) {
	var util = app.rulesUtil;
	var pid = util.getProperty('weinreChildPid');
	if (pid) {
		try {
			process.kill(pid);
		} catch(e) {}
	}
	
	var child = cp.spawn('node', [path.join(__dirname, 'weinre.js'), '--boundHost', 
	                              'localhost', '--httpPort', app.util.config.weinreport], 
	                              {stdio: [ 0, 1, 2 ]});
	util.setProperty('weinreChildPid', child.pid);
};