var util = require('./util.test');

module.exports = function() {
	util.request('http://referer.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('referer', 'xxx');
	});
};