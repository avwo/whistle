var https = require('https');
var http = require('http');
var extend = require('util')._extend;
var util = require('../../util');
var WhistleTransform = util.WhistleTransform;
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

function handleRes(res, data) {
	if (data) {
		extend(res.headers, data.headers);
		res.add(new WhistleTransform(data));
	}
	
}

module.exports = function(req, res, next) {
	var responsed, resData;
	req.request = function(options) {
		if (!options.proxy && util.isLocalAddress(options.host) && (options.port || 80) == config.port) {
			res.redirect(302, 'http://' + config.localUIHost + (options.path || ''));
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
		var headers = res.headers = _res.headers;
		res.trailers = _res.trailers;
		res.statusCode = _res.statusCode = _res.statusCode || 0;
		handleRes(res, resData);
		addRuleHeaders(headers, req);
		if (headers.location) {
			//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
			headers.location = util.encodeNonAsciiChar(headers.location);
		}
		res.src(_res);
		res.writeHead(_res.statusCode, _res.headers);
		res.trailers && res.addTrailers(res.trailers);
	};
	
	util.parseFileToJson(req.rules.res && req.rules.res.url, 
			function(err, data) {
		if (req.rules.head && req.rules.head.req) {
			data = extend(req.rules.head.res, data);
		}
		if (resData = data) {
			if (data.statusCode) {
				util.drain(req, function() {
					res.response(util.wrapResponse(data));
				});
				return;
			}
		}
		next();
	});
};