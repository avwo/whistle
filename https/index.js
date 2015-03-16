var httpsFlag = require('../package.json').whistleSsl + '.';
var httpsFlagLen = httpsFlag.length;

module.exports = function(req, res, next) {
	var host = req.headers.host;
	var isHttps = host.indexOf(httpsFlag) == 0 && host.indexOf('.', httpsFlagLen) != -1;
	if (isHttps) {
		req.headers.host = host.substring(httpsFlagLen);
		req.isHttps = true;
		var referer = req.headers.referer;
		if (referer) {
			var index = referer.indexOf(httpsFlag);
			if (index != -1 && host.indexOf('.', index + httpsFlagLen) != -1) {
				req.headers.referer = referer.replace(httpsFlag, '');
			}
		}
	}
	
	next();
};