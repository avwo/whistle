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
	
};