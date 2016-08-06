var util = require('../util.test');

module.exports = function() {
	util.request('http://req.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('referer', 'http://wproxy.org');
		data.headers.should.have.property('content-type', 'text/plain');
		data.body.should.equal('topbodybottom');
		data.method.should.equal('POST');
	});
	
	util.request({
		method: 'put',
		url: 'https://req.test.whistlejs.com/index2.html'
	}, function(res, data) {
		data.headers.should.have.property('referer', 'http://wproxy.org');
		data.headers.should.have.property('content-type', 'text/plain');
		data.body.should.equal('topbodybottom');
		data.method.should.equal('POST');
	});
};