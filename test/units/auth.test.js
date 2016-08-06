var util = require('../util.test');

module.exports = function() {
	util.request('http://au2th.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.not.have.property('authorization');
	});
	
	util.request({
		method: 'put',
		url: 'https://auth.test.whistlejs.com/index2.html'
	}, function(res, data) {
		data.headers.should.have.property('authorization');
	});
};