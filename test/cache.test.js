var util = require('./util.test');

module.exports = function() {
	util.request('http://cache.test.whistlejs.com/index.html', function(res, data) {
		res.headers.should.have.property('cache-control', 'max-age=60000');
	});
	
	util.request({
		method: 'post',
		url: 'https://cache.test.whistlejs.com/index.html'
	}, function(res, data) {
		res.headers.should.have.property('cache-control', 'max-age=60000');
	});
};