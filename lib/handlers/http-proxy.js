var extend = require('util')._extend;
var url = require('url');
var util = require('../util');

module.exports = function(req, res, next) {
	if (!util.isWebProtocol(req.options && req.options.protocol)) {
		next();
		return;
	}
	
	var config = this.config;
	var options = extend({}, req.options);
	var headers = extend({}, req.headers);
	if (options.proxy) {
		headers.Host = headers.host;//tencent的服务器不识别小写的host
	} else {
		headers.host = headers.Host = options.hostname + (options.port ? ':' + options.port : '');
	}
	
	req.request(options);
};