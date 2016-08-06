var util = require('./util.test');

module.exports = function() {
	util.request('http://log1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
		//body.should.equal('_<script>js</script>');
		console.log(body);
	});
	
	util.request({
		method: 'post',
		url: 'https://log2.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		//body.should.equal('_js');
	});
	
	util.request({
		method: 'post',
		url: 'https://log3.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		//body.should.equal('_');
	});
};