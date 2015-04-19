var https = require('https');
var http = require('http');
var util = require('../../util');
var config = util.config;

module.exports = function(req, res, next) {
	var responsed;
	req.request = function(options) {
		if (util.isLocalAddress(options.host) && (options.port || 80) == config.port) {
			res.redirect(302, 'http://' + config.localUIHost + options.path);
			return;
		}
		req.remoteAddress = options.host;
		req.pipe((options.protocol == 'https:' ? https : http).request(options, res.response));
	};
	
	res.response = function(_res) {
		if (responsed) {
			return;
		}
		responsed = true;
		var headers = res.headers = 
			_res.headers =  _res.headers || {};
		if (headers.location) {
			//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
			headers.location = util.encodeNonAsciiChar(headers.location);
		}
		res.src(_res);
		res.writeHead(_res.statusCode || 0, _res.headers);
	};
	
	next();
};