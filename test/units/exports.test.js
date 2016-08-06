var util = require('../util.test');

module.exports = function() {
	util.request('https://exports.test.whistlejs.com/index.html');
	util.request({
		url: 'http://exports.test.whistlejs.com/index2.html',
		method: 'post',
		body: 'sssssss'
	});
	
	util.request('http://exports.test.whistlejs.com/index3.html');
	util.request({
		url: 'https://exports.test.whistlejs.com/index4.html',
		method: 'post',
		body: 'sssssss'
	});
	
	util.request('https://exportsurl.test.whistlejs.com/index5.html');
	util.request({
		url: 'http://exportsurl.test.whistlejs.com/index6.html',
		method: 'post',
		body: 'sssssss'
	});
	
	util.request('http://exportsurl.test.whistlejs.com/index7.html');
	util.request({
		url: 'https://exportsurl.test.whistlejs.com/index8.html',
		method: 'post',
		body: 'sssssss'
	});
};