var util = require('../util.test');

module.exports = function() {
	util.request('http://tpl.test.whistlejs.com/index.html?resBody=%7Bcallback%7D(%7Bec%3A%200%7D)&callback=test', function(res, body) {
		body.should.equal('test({ec: 0})');
	});
	
	util.request('http://tpl.test.whistlejs.com/index.html?doNotParseJson&callback=test', function(res, body) {
		body.should.equal('test({ec: 0})');
	});
	
	util.request({
		method: 'post',
		url: 'https://tpl2.test.whistlejs.com/?resBody=%7Bcallback%7D(%7Bec%3A%200%7D)&callback=test'
	}, function(res, body) {
		body.should.equal('test({ec: 0})');
	});
};