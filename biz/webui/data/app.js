var cp = require('child_process');
var path = require('path');

module.exports = function init(app) {
	var util = app.rulesUtil;
	var pid = util.getProperty('uidataChildPid');
	if (pid) {
		try {
			process.kill(pid);
		} catch(e) {}
	}
	
	var child = cp.spawn('node', [path.join(__dirname, 'uidata.js'), app.util.config.uidataport], 
	                              {stdio: [ 0, 1, 2 ]});
	util.setProperty('uidataChildPid', child.pid);
};