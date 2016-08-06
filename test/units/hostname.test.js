var util = require('../util.test');

module.exports = function() {
	util.request('http://hostname.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('host', 'xxx');
	});
	
	util.request({
		url: 'http://hostname.test.whistlejs.com/index.html',
		method: 'post',
		body: 'sssssss'
	}, function(res, data) {
		data.headers.should.have.property('host', 'xxx');
	});
};