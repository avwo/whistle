var extend = require('util')._extend;
var util = require('../../util');
var agentConfig = {maxSockets: 8};
var httpAgent = new (require('http').Agent)(agentConfig);
var httpsAgent = new (require('https').Agent)(agentConfig);
var config = util.config;

module.exports = function(req, res, next) {
	var protocol = req.options && req.options.protocol;
	if (!util.isWebProtocol(protocol)) {
		next();
		return;
	}
	
	var options = extend({}, req.options);
	var headers = extend({}, req.headers);
	if (options.proxy) {
		headers['x-from-proxy'] = config.name;
		headers.host = headers.Host = headers.host;//tencent的服务器不识别小写的host
	} else {
		headers.host = headers.Host = options.hostname + (options.port ? ':' + options.port : '');
	}
	options.agent = protocol == 'https:' ? httpsAgent : httpAgent;
	options.rejectUnauthorized = false;
	options.headers = headers;
	options.method = req.method;
	options.hostname = null;
	req.request(options);
};