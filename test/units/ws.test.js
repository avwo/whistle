var util = require('../util.test');

module.exports = function() {
	util.request('ws://test.whistlejs.com/index.html', function(data) {
		console.log(data)
	});
	
	util.request('wss://test.whistlejs.com/index.html', function(data) {
		console.log(data)
	});
};