var util = require('../util.test');

module.exports = function() {
	util.request('http://resheaders.test.whistlejs.com/index.html', function(res, data) {
		res.headers.should.have.property('x-test1', 'value1');
		res.headers.should.have.property('x-test2', 'value2');
		res.headers.should.have.property('x-testn', 'valueN');
	});
	
	util.request({
		method: 'post',
		url: 'https://resheaders.test.whistlejs.com/index.html'
	}, function(res, data) {
		res.headers.should.have.property('x-test1', 'value1');
		res.headers.should.have.property('x-test2', 'value2');
		res.headers.should.have.property('x-testn', 'valueN');
	});
};