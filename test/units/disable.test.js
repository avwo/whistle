var util = require('../util.test');

module.exports = function() {
	util.request('http://disable.test.whistlejs.com/index.html', function(res, data) {
		res.headers.should.have.property('cache-control', 'no-cache');
	});
	
	util.request({
		method: 'post',
		url: 'https://disable.test.whistlejs.com/index.html'
	}, function(res, data) {
		res.headers.should.have.property('cache-control', 'no-cache');
		res.headers.should.not.have.property('set-cookie');
	});
};