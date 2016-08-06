var util = require('../util.test');

module.exports = function() {
	util.request({
		url: 'https://reqreplace.test.whistlejs.com/',
		method: 'post',
		body: 'testxxx'
	}, function(res, data) {
		data.body.should.equal('abcxxx');
	});
	
	util.request({
		url: 'http://reqreplace.test.whistlejs.com/',
		method: 'post',
		body: 'test123'
	}, function(res, data) {
		data.body.should.equal('abc123');
	});
};