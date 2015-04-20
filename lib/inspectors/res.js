var https = require('https');
var http = require('http');
var rules = require('../rules');
var util = require('../../util');
var config = util.config;

function addRuleHeaders(headers, req) {
	var name = 'x-' + config.name + '-';
	var rules = req.rules;
	for (var i in rules) {
		headers[name + i] = rules[i].matcher;
	}
	headers[name + 'ip'] = req.hostIp || '127.0.0.1';
	return headers;
}

module.exports = function(req, res, next) {
	var responsed;
	req.request = function(options) {
		if (util.isLocalAddress(options.host) && (options.port || 80) == config.port) {
			res.redirect(302, 'http://' + config.localUIHost + options.path);
			return;
		}
		
		req.hostIp = options.host;
		req.pipe((options.protocol == 'https:' ? https : http).request(options, res.response));
	};
	
	res.response = function(_res) {
		if (responsed) {
			return;
		}
		responsed = true;
		var headers = res.headers = 
			_res.headers =  _res.headers || {};
		addRuleHeaders(headers, req);
		if (headers.location) {
			//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
			headers.location = util.encodeNonAsciiChar(headers.location);
		}
		res.src(_res);
		res.writeHead(_res.statusCode || 0, _res.headers);
	};
	
	next();
};