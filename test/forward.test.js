var util = require('./util.test');

module.exports = function() {
	util.request('http://forward.test.whistlejs.com/index.html', function(res, data) {
		data.should.have.property('type', 'server');
	});
	
	util.request({
		method: 'post',
		url: 'http://forward.test.whistlejs.com/index.html'
	}, function(res, data) {
		data.should.have.property('type', 'server');
	});
};