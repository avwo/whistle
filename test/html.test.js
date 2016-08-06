var util = require('./util.test');

module.exports = function() {
	util.request('http://html1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
		body.should.equal('_html');
	});
	
	util.request({
		method: 'post',
		url: 'https://html2.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		body.should.equal('_');
	});
	
	util.request({
		method: 'post',
		url: 'http://html3.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		body.should.equal('_');
	});
};