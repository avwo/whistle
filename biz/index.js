var url = require('url');
var https = require('https');
var http = require('http');
var util = require('../util');
var config = util.config;

function request(req, res, port) {
	var options = url.parse(util.getFullUrl(req));
	options.host = '127.0.0.1';
	options.method = req.method;
	options.hostname = null;
	options.protocol = null;
	if (port) {
		options.port = port;
	}
	req.headers['x-forwarded-for'] = util.getClientIp(req);
	options.headers = req.headers;
	req.pipe(http.request(options, function(_res) {
		res.writeHead(_res.statusCode || 0, _res.headers);
		res.src(_res);
	}));
}

module.exports = function(req, res, next) {
	var host = req.headers.host;
	if (host == config.localUIHost) {
		var path = util.hasProtocol(req.url) ? url.parse(req.url).path : req.url;
		request(req, res, /^\/data\b/.test(path) ? config.uidataport : config.uiport);
	} else if (host == config.WEINRE_HOST) {
		request(req, res, config.weinreport);
	} else {
		next();
	}
};
