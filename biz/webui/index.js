var url = require('url');
var https = require('https');
var http = require('http');
var util = require('../../util');
var config = util.config;

module.exports = function(req, res, next) {
	if (req.headers.host == config.localUIHost) {
		var options = url.parse(util.getFullUrl(req));
		options.host = '127.0.0.1';
		options.hostname = null;
		options.port = config.uiport;
		req.headers['x-forwarded-for'] = util.getClientIp(req);
		options.headers = req.headers;
		req.pipe(http.request(options, function(_res) {
			res.writeHead(_res.statusCode || 0, _res.headers);
			res.src(_res);
		}));
		return;
	}
	
	next();
};