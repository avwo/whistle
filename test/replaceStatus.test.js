var util = require('./util.test');

module.exports = function() {
	util.request('http://replacestatus.test.whistlejs.com/index.html', function(res, data) {
		res.statusCode.should.equal(500);
	});
	
	util.request({
		method: 'post',
		url: 'https://replacestatus.test.whistlejs.com/index.html'
	}, function(res, data) {
		res.statusCode.should.equal(500);
	});
};