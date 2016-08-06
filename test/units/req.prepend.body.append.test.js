var util = require('../util.test');

module.exports = function() {
	util.request({
		url: 'https://reqprepend.reqbody.reqappend.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('prependbodyappend');
	});
	
	util.request({
		url: 'http://reqprepend.reqbody.reqappend.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('prependbodyappend');
	});
};