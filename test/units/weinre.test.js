var util = require('../util.test');

module.exports = function() {
	util.request('http://weinre1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
		body.should.containEql('<script src="http://weinre.local.whistlejs.com/target/target-script-min.js#xxx"></script>');
	});
	
	util.request({
		url: 'http://weinre2.test.whistlejs.com/index.html',
		method: 'post',
		body: 'sssssss'
	});
	
	util.request('https://weinre3.test.whistlejs.com/index.html');
	
	util.request({
		url: 'https://weinre4.test.whistlejs.com/index.html',
		method: 'post',
		body: 'sssssss'
	});
};