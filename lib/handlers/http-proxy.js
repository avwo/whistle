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
			headers[config.httpsProxyHost] = options.host + ':' + options.port;
			options.protocol = 'http:';
			options._proxyHost = options.host;
			options.host = '127.0.0.1';
			options.port = config.httpsproxyport;
		}
	} else {
		headers.host = headers.Host = options.hostname + (options.port ? ':' + options.port : '');
	}
	
	options.agent = options.protocol == 'https:' ? config.httpsAgent : config.httpAgent;
	options.rejectUnauthorized = false;
	options.headers = headers;
	options.method = req.method;
	options.hostname = null;
	req.request(options);
};