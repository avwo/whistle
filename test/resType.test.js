var util = require('./util.test');

module.exports = function() {
	util.request('http://reqtype.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('content-type', 'text/plain');
	});
};