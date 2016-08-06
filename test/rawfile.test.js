var util = require('./util.test');

module.exports = function() {
	
	util.request('http://rawfile.test.whistlejs.com/index.html?doNotParseJson', function(res, body) {
		console.log(body);
	});
	
	util.request({
		method: 'post',
		url: 'https://rawfile.test.whistlejs.com/?doNotParseJson'
	}, function(res, body) {
		console.log(body);
	});
};