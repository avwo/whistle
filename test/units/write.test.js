var util = require('../util.test');

module.exports = function() {
	var now = Date.now();
	util.request('http://reqwrite.test.whistlejs.com/index.html');
	util.request({
		url: 'https://reqwrite.test.whistlejs.com/index.html',
		method: 'post',
		body: util.getTextBySize(32)
	});
	
	util.request('https://reswrite2.test.whistlejs.com/index.html');
	util.request({
		url: 'http://reswrite2.test.whistlejs.com/index.html',
		method: 'post',
		body: util.getTextBySize(128)
	});
};