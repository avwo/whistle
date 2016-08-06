var util = require('../util.test');

module.exports = function() {
	util.request('http://reqcharset.test.whistlejs.com/index.html', function(res, data) {
		data.headers['content-type'].should.containEql('utf8');
	});
};