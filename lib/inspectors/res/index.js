var https = require('https');
var http = require('http');

module.exports = function(req, res, next) {
	var responsed;
	req.request = function(options) {
		req.remoteAddress = options.host;
		req.pipe((options.protocol == 'https:' ? https : http).request(options, res.response));
	};
	
	res.response = function(_res) {
		if (responsed) {
			return;
		}
		responsed = true;
		res.writeHead(_res.statusCode || 0, _res.headers);
		res.src(_res);
	};
	
	next();
};