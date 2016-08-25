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

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: config.wsPort });

wss.on('connection', function connection(ws) {
	var req = ws.upgradeReq;
	ws.on('message', function(msg) {
		ws.send(JSON.stringify({
			type: 'server',
			method: req.method,
			headers: req.headers,
			body: msg
		}, null, '\t'));
	});
});

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
			url: req.url,
			method: req.method,
			headers: req.headers,
			body: body
		}, null, '\t'))
	});
}).listen(config.serverPort, startTest);

startWhistle({
	port: config.port
}, startTest);

function startTest() {
	if (--count > 0) {
		return;
	}
	
	var done;
	function testAll() {
		if (done) {
			return;
		}
		done = true;
		testList.forEach(function(fn) {
			fn();
		});
	}
	
	(function getData() {
		util.request('http://local.whistlejs.com/cgi-bin/get-data', function() {
			testAll();
			setTimeout(getData, 5000);
		});
	})();
}


