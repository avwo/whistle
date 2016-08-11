var util = require('../util.test');

module.exports = function() {
	util.request('http://urlreplace.host.test.whistlejs.com/index.html?name=aven&test=abc', function(res, data) {
		data.url.should.equal('/index.html?user=ttven&test=ttbc');
	});
	
	util.request({
		method: 'post',
		url: 'http://urlreplace.host.test.whistlejs.com/index.html?name=aven&test=abc'
	}, function(res, data) {
		data.url.should.equal('/index.html?user=ttven&test=ttbc');
	});
};