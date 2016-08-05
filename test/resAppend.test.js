var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'https://resappend.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.equal('append');
	});
	
	util.request('http://resappend.test.whistlejs.com/?resBody=', function(res, body) {
		body.should.equal('append');
	});
};