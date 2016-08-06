var util = require('../util.test');

module.exports = function() {
	util.request('http://reqcors.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('origin', '*');
		data.headers.should.have.property('access-control-request-method', 'POST');
		data.headers.should.have.property('access-control-request-headers', 'x-test');
	});
	
	util.request({
		method: 'post',
		url: 'https://reqcors.test.whistlejs.com/index.html'
	}, function(res, data) {
		data.headers.should.have.property('origin', '*');
		data.headers.should.have.property('access-control-request-method', 'POST');
		data.headers.should.have.property('access-control-request-headers', 'x-test');
	});
};