var cp = require('child_process');
var util = require('../../util');
var config = util.config;

cp.spawn('node', ['--boundHost', config.WEINRE_HOST, '--httpPort', config.weinreport], {
	stdio: [ 0, 1, 2 ]
});