var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'https://resreplace.test.whistlejs.com/?resBody=123test',
		method: 'post'
	}, function(res, body) {
		body.should.equal('123abc');
	});
	
	util.request('http://resreplace.test.whistlejs.com/?resBody=test123', function(res, body) {
		body.should.equal('abc123');
	});
};