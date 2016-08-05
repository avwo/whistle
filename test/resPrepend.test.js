var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'http://resprepend.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.equal('prepend');
	});
};