var util = require('./util.test');

module.exports = function() {
	util.request('http://reqheaders.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('x-test1', 'value1');
		data.headers.should.have.property('x-test2', 'value2');
		data.headers.should.have.property('x-testn', 'valueN');
	});
	
	util.request({
		method: 'post',
		url: 'https://reqheaders.test.whistlejs.com/index.html'
	}, function(res, data) {
		data.headers.should.have.property('x-test1', 'value1');
		data.headers.should.have.property('x-test2', 'value2');
		data.headers.should.have.property('x-testn', 'valueN');
	});
};