var cp = require('child_process');
var path = require('path');

module.exports = function init(app) {
	var util = app.rulesUtil;
	require('../../start')(util, 'uidataChildPid', 
			[path.join(__dirname, 'uidata.js'), app.util.config.uidataport]);
};