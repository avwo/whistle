var util = require('../util.test');

module.exports = function() {
	util.request('http://rescookies.test.whistlejs.com/', function(res, data) {
		res.headers['set-cookie'].should.containEql('key2=value2');
	});
};