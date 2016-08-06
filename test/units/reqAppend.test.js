var util = require('../util.test');

module.exports = function() {
	util.request({
		url: 'https://reqappend.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('append');
	});
	
	util.request({
		url: 'http://reqappend.test.whistlejs.com/',
		method: 'post'
	}, function(res, data) {
		data.body.should.equal('append');
	});
};