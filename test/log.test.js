var util = require('./util.test');

module.exports = function() {
	util.request('http://log1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
		body.length.should.above(500);
		body.should.containEql('<script>log</script>\r\n_');
	});
	
	util.request({
		method: 'post',
		url: 'https://log2.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		body.length.should.above(500);
		body.should.containEql('_\r\nlog');
	});
	
	util.request({
		method: 'post',
		url: 'https://log3.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		body.should.equal('_');
	});
};