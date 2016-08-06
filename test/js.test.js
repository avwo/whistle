var util = require('./util.test');

module.exports = function() {
	util.request('http://js1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
		console.log(res.headers, body)
	});
	
	util.request({
		method: 'post',
		url: 'https://js2.test.whistlejs.com/index.html?resBody=_'
	}, function(res, body) {
		
	});
};