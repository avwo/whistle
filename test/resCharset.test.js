var util = require('./util.test');

module.exports = function() {
	util.request('http://rescharset.test.whistlejs.com/index.html', function(res, data) {
		res.headers['content-type'].should.containEql('utf8');
	});
};