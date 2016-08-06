var util = require('./util.test');

module.exports = function() {
	util.request('http://js1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
		body.should.equal('_<script>js</script>');
	});
	
	util.request({
		method: 'post',
		url: 'https://js2.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		body.should.equal('_js');
	});
	
	util.request({
		method: 'post',
		url: 'https://js32.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		body.should.equal('_');
	});
};