var util = require('../util.test');

module.exports = function() {
	util.request('https://redirect.test.whistlejs.com/index.html', function(res, data) {
		data.should.have.property('url', 'http://test.whistlejs.com/');
	});
	
	util.request({
		method: 'post',
		url: 'http://redirect.test.whistlejs.com/index.html'
	}, function(res, data) {
		data.should.have.property('url', 'http://test.whistlejs.com/');
	});
};