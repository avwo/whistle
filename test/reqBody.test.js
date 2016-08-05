var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'https://reqbody.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('body');
	});
	
	util.request({
		url: 'http://reqbody.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('body');
	});
};