var startWhistle = require('../index');
var util = require('./util.test');
var config = require('./config.test');
var testList = ['plugin', 'host', 'rule', 'reqSpeed'].map(function(name) {
	return require('./' + name + '.test');
});

startWhistle({
	port: config.port
}, function() {
	testList.forEach(function(fn) {
		fn();
	});
});


