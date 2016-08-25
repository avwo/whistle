var util = require('../util.test');
var path = require('path');
var fs = require('fs');

module.exports = function() {
	
	util.request({
		url: 'http://prependbin.bodybin.appendbin.test.whistlejs.com/?doNotParseJson',
		method: 'post'
	}, function(res, body) {
		body.should.be.equal(res.body);
	});
	
	util.request({
		url: 'http://prependbin.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.be.equal(res.body);
		body.should.be.equal('我们是社会主义接班人!');
	});
	
	util.request({
		url: 'http://bodybin.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.be.equal(res.body);
	});
	
	util.request({
		url: 'http://appendbin.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.be.equal(res.body);
	});
	
	util.request({
		url: 'http://prependbin.bodybin.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.be.equal(res.body);
	});
	
	util.request({
		url: 'http://prependbin.appendbin.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.be.equal(res.body);
	});
	
	util.request({
		url: 'http://bodybin.appendbin.test.whistlejs.com/?resBody=',
		method: 'post'
	}, function(res, body) {
		body.should.be.equal(res.body);
	});
};