var util = require('./util.test');

module.exports = function() {
	util.request('http://restype.test.whistlejs.com/index.html', function(res, data) {
		res.headers.should.have.property('content-type', 'text/html');
	});
};