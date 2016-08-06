var util = require('../util.test');

module.exports = function() {
	util.request('http://referer.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('referer', 'xxx');
	});
	
	util.request({
		url: 'https://referer.test.whistlejs.com/index.html',
		method: 'post'
	}, function(res, data) {
		data.headers.should.have.property('referer', 'xxx');
	});
};