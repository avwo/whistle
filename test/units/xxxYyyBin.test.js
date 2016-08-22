var util = require('../util.test');
var path = require('path');
var fs = require('fs');
var ctn = fs.readFileSync(path.join(__dirname, '../assets/bin/file.txt'), {encoding: 'utf8'});

module.exports = function() {
	
	util.request({
		url: 'http://prependbin.bodybin.appendbin.test.whistlejs.com/?doNotParseJson',
		method: 'post'
	}, function(res, data) {
		console.log(data);
		console.log(res.body);
	});
};