var cp = require('child_process');
var path = require('path');
var util = require('../../util');
var config = util.config;

cp.spawn('node', [path.join(__dirname, 'weinre.js'), '--boundHost', 
                  config.WEINRE_HOST, '--httpPort', config.weinreport], {
	stdio: [ 0, 1, 2 ]
});