var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'http://resprepend.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.equal('prepend');
	});
	
	util.request('https://resprepend.test.whistlejs.com/?resBody=', function(res, body) {
		body.should.equal('prepend');
	});
};