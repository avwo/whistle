var util = require('../util.test');

module.exports = function() {
	var body = 'test__';
	util.request({
		url: 'http://test.whistlejs.com/',
		body: body
	}, function(res, data) {
		data.body.should.be.equal(body);
	});
	
	util.request('http://rule.test.whistlejs.com/', function(res, data) {
		data.type.should.equal('server');
		data.headers.host.should.equal('host.test.whistlejs.com');
	});
	
	util.request('http://rule1.test.whistlejs.com/?abc=123', function(res, data) {
		data.type.should.equal('server');
		data.headers.host.should.equal('host.test.whistlejs.com');
		data.url.should.endWith('/?test1abc=123');
	});
	
	util.request('http://rule2.test.whistlejs.com/?abc=1', function(res, data) {
		data.type.should.equal('server');
		data.headers.host.should.equal('host.test.whistlejs.com');
		data.url.should.endWith('/?test2');
	});
	
	util.request('http://rule2.test.whistlejs.com/?abc=', function(res, data) {
		data.should.not.have.property('type');
		data.headers.host.should.equal('rule2.test.whistlejs.com');
	});
	
	util.request('http://rule3.test.whistlejs.com/ab', function(res, data) {
		data.should.not.have.property('type');
		data.headers.host.should.not.equal('host.test.whistlejs.com');
	});
	
	util.request('http://rule3.test.whistlejs.com/abc', function(res, data) {
		data.type.should.equal('server');
		data.headers.host.should.equal('host.test.whistlejs.com');
		data.url.should.endWith('/?test2');
	});
	
	util.request('http://rule4.test.whistlejs.com/abc', function(res, data) {
		data.should.not.have.property('type');
		data.headers.host.should.not.equal('host.test.whistlejs.com');
	});
	
	util.request('http://rule4.test.whistlejs.com/abc?abc=1', function(res, data) {
		data.type.should.equal('server');
		data.headers.host.should.equal('host.test.whistlejs.com');
		data.url.should.endWith('/?test2');
	});
};