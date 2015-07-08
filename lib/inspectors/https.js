var Transform = require('pipestream').Transform;
var util = require('../../util');
var HTTPS_FLAG = require('../../package.json').whistleSsl + '.';
var HTTPS_FLAG_LEN = HTTPS_FLAG.length;
var HTTPS_RE = /https:(\/\/|\\\/\\\/)/ig;
var RESET_COOKIE_RE = /secure;?|domain=([^;]*);?/ig;

function getTransform() {
	var transform = new Transform();
	var rest = '';
	transform._transform = function(chunk, encoding, callback) {
		if (chunk) {
			rest = chunk = (rest + chunk).replace(HTTPS_RE, 'http:$1' + HTTPS_FLAG);
			var len = chunk.length - 7;
			if (len > 0) {
				rest = chunk.substring(len);
				chunk = chunk.substring(0, len);
			} else {
				chunk = null;
			}
		} else {
			chunk = rest || null;
		}
		callback(null, chunk);
	};
	return transform;
}

module.exports = function(req, res, next) {
	if (req.headers[util.HTTPS_FIELD] || req.socket.isHttps) {//防止socket长连接导致新请求的头部无法加util.HTTPS_FIELD
		req.socket.isHttps = true;
		req.isHttps = true;
		delete req.headers[util.HTTPS_FIELD];
	} else {
		var host = req.headers.host;
		var isHttps = host && host.indexOf(HTTPS_FLAG) == 0 && host.indexOf('.', HTTPS_FLAG_LEN) != -1;
		if (isHttps) {
			host = req.headers.host = host.substring(HTTPS_FLAG_LEN);
			req.isHttps = req.isWhistleHttps = true;
			var referer = req.headers.referer;
			if (referer) {
				req.headers.referer = referer.replace('http://' + HTTPS_FLAG, 'https://');
			}
			
			res.on('src', function(_res) {
				var headers = _res.headers;
				if (/^https:\/\//i.test(headers.location)) {
					headers.location = 'http:' + HTTPS_FLAG + util.removeProtocol(headers.location, true);
				}
				
				var cookies = headers['set-cookie'];
				if (Array.isArray(cookies)) {
					host = host.split(':')[0].split('.');
					host = '.' + host.slice(host.length - 2).join('.');
					headers['set-cookie'] = cookies.map(function(cookie) {
						return cookie.replace(RESET_COOKIE_RE, '') + '; DOMAIN=' + host + ';';
					});
				}
				
				if (util.supportHtmlTransform(_res)) {
					res.addTextTransform(getTransform(), true);
				}
			});
		}
	}
	
	next();
};