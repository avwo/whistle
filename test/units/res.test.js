var util = require('../util.test');

module.exports = function() {
	util.request('http://res.test.whistlejs.com/index.html?resBody=', function(res, body) {
		res.headers.should.have.property('content-type', 'text/plain');
		body.should.equal('topbodybottom');
	});
	
	util.request({
		method: 'put',
		url: 'https://res.test.whistlejs.com/index2.html?resBody='
	}, function(res, body) {
		res.headers.should.have.property('content-type', 'text/plain');
		body.should.equal('topbodybottom');
	});
};