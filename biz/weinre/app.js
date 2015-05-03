var cp = require('child_process');
var path = require('path');

cp.spawn('node', [path.join(__dirname, 'weinre.js')], {
	stdio: [ 0, 1, 2 ]
});