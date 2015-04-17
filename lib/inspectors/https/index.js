var util = require('../../../util');
var HTTPS_FLAG = util.config.whistleSsl + '.';
var HTTPS_FLAG_LEN = HTTPS_FLAG.length;

module.exports = function(req, res, next) {
	var host = req.headers.host;
	var isHttps = host && host.indexOf(HTTPS_FLAG) == 0 && host.indexOf('.', HTTPS_FLAG_LEN) != -1;
	if (isHttps) {
		req.headers.host = host.substring(HTTPS_FLAG_LEN);
		var referer = req.headers.referer;
		if (referer) {
			var index = referer.indexOf(HTTPS_FLAG);
			if (index != -1 && host.indexOf('.', index + HTTPS_FLAG_LEN) != -1) {
				req.headers.referer = referer.replace(HTTPS_FLAG, '');
			}
		}
		
		res.on('src', function(_res) {
			var headers = _res.headers;
			if (/^https:\/\//i.test(headers.location)) {
				var location = util.removeProtocol(headers.location);
				headers.location = 'http://' + HTTPS_FLAG + location;
			}
		});
	}
	
	next();
};