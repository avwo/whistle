var cp = require('child_process');
var path = require('path');

module.exports = function init(app) {
	var util = app.rulesUtil;
	var config = app.util.config;
	require('../start')(util, 'tianmaChildPid', 
			[path.join(__dirname, 'tianma.js'), config.tianmaport, config.tianmasslport]);
};