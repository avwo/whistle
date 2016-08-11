var util = require('../util.test');

module.exports = function() {
	util.request('http://urlreplace.urlparams.test.whistlejs.com/index.html?name=aven', function(res, data) {
		//data.url.substring(data.url.indexOf('?') + 1).should.equal('test=abc');
		console.log(data);
	});
	
	util.request({
		method: 'post',
		url: 'http://urlreplace.urlparams.test.whistlejs.com/index.html?name=aven'
	}, function(res, data) {
		//data.url.substring(data.url.indexOf('?') + 1).should.equal('test=abc');
		console.log(data);
	});
};