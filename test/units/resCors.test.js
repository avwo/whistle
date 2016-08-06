var util = require('../util.test');

module.exports = function() {
	util.request('http://rescors.test.whistlejs.com/index.html', function(res, data) {
		res.headers.should.have.property('access-control-max-age', '300000');
		res.headers.should.have.property('access-control-allow-credentials', 'true');
		res.headers.should.have.property('access-control-expose-headers', 'x-test');
		res.headers.should.have.property('access-control-allow-methods', 'POST');
		res.headers.should.have.property('access-control-allow-origin', '*');
	});
	
	util.request({
		method: 'post',
		url: 'https://rescors.test.whistlejs.com/index.html'
	}, function(res, data) {
		res.headers.should.have.property('access-control-max-age', '300000');
		res.headers.should.have.property('access-control-allow-credentials', 'true');
		res.headers.should.have.property('access-control-expose-headers', 'x-test');
		res.headers.should.have.property('access-control-allow-methods', 'POST');
		res.headers.should.have.property('access-control-allow-origin', '*');
	});
};