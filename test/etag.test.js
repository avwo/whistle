var util = require('./util.test');

module.exports = function() {
	util.request('http://etag.test.whistlejs.com/index.html', function(res, data) {
		data.headers.should.have.property('etag', 'xxx');
	});
};