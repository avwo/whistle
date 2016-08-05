var util = require('./util.test');

module.exports = function() {
	util.request('http://etag.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('etag', 'xxx');
	});
	
	util.request({
		url: 'http://etag.test.whistlejs.com/index.html',
		method: 'post',
		body: 'sssssss'
	}, function(res, data) {
		data.headers.should.have.property('etag', 'xxx');
	});
};