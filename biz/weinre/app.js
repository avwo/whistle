var config = require('../../util').config;

module.exports = function init(app) {
	//weinre用到老版本的express，改版本会直接往下面原型对象设置__defineGetter__
	//会影响到同一进程的web应用，新版的express处理方式更加合理些
	var req = require('http').IncomingMessage.prototype;
	var __defineGetter__ = req.__defineGetter__;
	req.__defineGetter__ = function() {};
	require('weinre').run({
		boundHost: 'localhost',
		httpPort: parseInt(app.weinreport, 10),
		verbose: false,
		debug: false,
		readTimeout: 5,
		deathTimeout: 15
	});
	req.__defineGetter__ = __defineGetter__;
};