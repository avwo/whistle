var startWhistle = require('../index');
var util = require('./util.test');
var config = require('./config.test');

startWhistle({
	port: config.port
});

util.request('http://test.whistlejs.com/', function(body) {
	console.log(body);
});

