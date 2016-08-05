var util = require('./util.test');

module.exports = function() {
	util.request('http://ua.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('user-agent', 'xxx');
	});
	
	util.request('https://ua.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('user-agent', 'xxx');
	});
};