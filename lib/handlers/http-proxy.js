var extend = require('util')._extend;
var url = require('url');
var util = require('../../util');
var config = util.config;
var agentConfig = {maxSockets: config.maxSockets || 10};
var httpAgent = new (require('http').Agent)(agentConfig);
var httpsAgent = new (require('https').Agent)(agentConfig);

module.exports = function(req, res, next) {
	if (!util.isWebProtocol(req.options && req.options.protocol)) {
		next();
		return;
	}
	
	var options = extend({}, req.options);
	var headers = extend({}, req.headers);
	if (options.proxy) {
		headers['x-from-proxy'] = config.name;
		headers.Host = headers.host;//tencent的服务器不识别小写的host
		if (req.isHttps) {
			headers[config.httpsProxyHost] = options.host + ':' + options.port;
			options.protocol = 'http:';
			options.host = '127.0.0.1';
			options.port = config.httpsproxyport;
		}
	} else {
		headers.host = headers.Host = options.hostname + (options.port ? ':' + options.port : '');
	}
	
	options.agent = options.protocol == 'https:' ? httpsAgent : httpAgent;
	options.rejectUnauthorized = false;
	options.headers = headers;
	options.method = req.method;
	options.hostname = null;
	req.request(options);
};