var util = require('./util.test');

module.exports = function() {
	var now = Date.now();
	util.request('http://ua.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('user-agent', 'xxx');
	});
};