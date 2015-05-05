var cp = require('child_process');
var path = require('path');

module.exports = function init(app) {
	var util = app.rulesUtil;
	require('../start')(util, 'weinreChildPid', 
			[path.join(__dirname, 'weinre.js'), '--boundHost', 
	     	                              'localhost', '--httpPort', app.util.config.weinreport]);
};