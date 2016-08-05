var util = require('./util.test');

module.exports = function() {
	util.request('https://resbody.test.whistlejs.com/?resBody=', function(res, body) {
		body.should.equal('body');
	});
	
	util.request({
		url: 'https://resbody.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.equal('body');
	});
};