var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'https://reqprepend.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('prepend');
	});
	
	util.request({
		url: 'http://reqprepend.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('prepend');
	});
};