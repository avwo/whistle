var util = require('../../../util');
var getTransform = require('./transform');
var HTTPS_FLAG = util.config.whistleSsl + '.';
var HTTPS_FLAG_LEN = HTTPS_FLAG.length;
var RESET_COOKIE_RE = /secure;?|domain=([^;]*);?/ig;

module.exports = function(req, res, next) {
	var host = req.headers.host;
	var isHttps = host && host.indexOf(HTTPS_FLAG) == 0 && host.indexOf('.', HTTPS_FLAG_LEN) != -1;
	if (isHttps) {
		host = req.headers.host = host.substring(HTTPS_FLAG_LEN);
		req.isHttps = true;
		var referer = req.headers.referer;
		if (referer) {
			req.headers.referer = referer.replace(HTTPS_FLAG, '');
		}
		
		res.on('src', function(_res) {
			var headers = _res.headers;
			if (/^https:\/\//i.test(headers.location)) {
				var location = util.removeProtocol(headers.location);
				headers.location = 'http://' + HTTPS_FLAG + location;
			}
			
			var cookies = headers['set-cookie'];
			if (Array.isArray(cookies)) {
				host = host.split(':')[0].split('.');
				host = '.' + host.slice(host.length - 2).join('.');
				headers['set-cookie'] = cookies.map(function(cookie) {
					return cookie.replace(RESET_COOKIE_RE, '') + '; DOMAIN=' + host + ';';
				});
			}
			
			if (util.supportHtmlTransform(headers)) {
				res.addTextTransform(getTransform());
			}
		});
	}
	
	next();
};