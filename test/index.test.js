var http = require('http');
var path = require('path');
var StringDecoder = require('string_decoder').StringDecoder;
var should = require('should');
require('should-http');
var fs = require('fs');
var startWhistle = require('../index');
var util = require('./util.test');
var config = require('./config.test');
var testList = fs.readdirSync(path.join(__dirname, './units')).map(function(name) {
	return require('./units/' + name);
});
var count = 2;

startWhistle({
	port: config.port
}, startTest);

http.createServer(function(req, res) {
	req.on('error', util.noop);
	res.on('error', util.noop);
	
	var body = '';
	var decoder = new StringDecoder('utf8'); 
	req.on('data', function(data) {
		body += decoder.write(data);
	});
	req.on('end', function() {
		body += decoder.end();
		res.end(JSON.stringify({
			type: 'server',
			method: req.method,
			headers: req.headers,
			body: body
		}, null, '\t'))
	});
}).listen(config.serverPort, startTest);


function startTest() {
	if (--count > 0) {
		return;
	}
	
	testList.forEach(function(fn) {
		fn();
	});
}


