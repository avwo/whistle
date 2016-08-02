var startWhistle = require('../index');
var util = require('./util.test');
var config = require('./config.test');

startWhistle({
	port: config.port
});

util.request({
	url: 'http://test.whistlejs.com/',
	body: 'test'
}, function(data) {
	console.log(data.body);
});

