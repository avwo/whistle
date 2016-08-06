var util = require('../util.test');

module.exports = function() {
	
	util.request('http://raw.test.whistlejs.com/index.html?doNotParseJson', function(res, body) {
		res.statusCode.should.equal(500);
		body.should.equal('test');
		res.headers.should.have.property('content-type', 'text/plain');
	});
	
	util.request({
		method: 'post',
		url: 'https://raw.test.whistlejs.com/?doNotParseJson'
	}, function(res, body) {
		res.statusCode.should.equal(500);
		body.should.equal('test');
		res.headers.should.have.property('content-type', 'text/plain');
	});
	
	util.request('http://xraw.test.whistlejs.com/index2.html', function(res, data) {
		data.should.have.property('type', 'server');
	});
};