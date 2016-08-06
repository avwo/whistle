var util = require('../util.test');

module.exports = function() {
	util.request('http://test.whistlejs.com/index.html', function(res, data) {
		data.method.should.equal('GET');
	});
	
	util.request({
		method: 'put',
		url: 'https://test.whistlejs.com/index.html'
	}, function(res, data) {
		data.method.should.equal('PUT');
	});
};