var util = require('../util.test');

module.exports = function() {
	var now = Date.now();
	util.request('http://reqwrite.test.whistlejs.com/index.html', function(res, data) {
		
	});
	
	util.request({
		url: 'https://reqwrite.test.whistlejs.com/index.html',
		method: 'post',
		body: util.getTextBySize(32)
	}, function(res, data) {
		
	});
	
//	util.request('https://reswriteraw.test.whistlejs.com/index.html', function(res, data, err) {
//		console.log(err);
//	});
//	
//	util.request({
//		url: 'http://reswriteraw.test.whistlejs.com/index.html',
//		method: 'post',
//		body: util.getTextBySize(128)
//	}, function(res, data) {
//		console.log(data);
//	});
};