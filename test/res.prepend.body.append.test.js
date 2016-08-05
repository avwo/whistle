var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'https://resprepend.resbody.resappend.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.equal('prependbodyappend');
	});
	
	util.request('http://resprepend.resbody.resappend.test.whistlejs.com/?resBody=', function(res, body) {
		body.should.equal('prependbodyappend');
	});
};