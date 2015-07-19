var extend = require('util')._extend;
var url = require('url');
var util = require('../../util');

module.exports = function(req, res, next) {
	if (!util.isWebProtocol(req.options && req.options.protocol)) {
		next();
		return;
	}
	
	var config = this.config;
	var options = extend({}, req.options);
	var headers = extend({}, req.headers);
	if (options.proxy) {
		headers[util.PROXY_ID] = config.name;
		headers.Host = headers.host;//tencent的服务器不识别小写的host
		if (req.isHttps) {
			options.protocol = 'http:';
			options.host = '127.0.0.1';
			options.port = config.httpsproxyport;
		}
	} else {
		headers.host = headers.Host = options.hostname + (options.port ? ':' + options.port : '');
	}
	
	options.headers = headers;
	options.method = req.method;
	req.request(options);
};