var startWhistle = require('../index');
var util = require('./util.test');
var config = require('./config.test');

startWhistle({
	port: config.port
}, function() {
	var startTime = Date.now();
	util.request({
		url: 'http://test.whistlejs.com/',
		body: 'test'
	}, function(res, data) {
		if (data) {
			console.log(data.body);
		}
	});
	
	util.request('http://reqdelay.test.whistlejs.com', function(res, data) {
		if (data) {
			console.log(Date.now() - startTime > 1000);
		}
	});
});


