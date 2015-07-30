
module.exports = function init(config) {
	//weinre用到老版本的express，改版本会直接往下面原型对象设置__defineGetter__
	//会影响到同一进程的web应用，新版的express处理方式更加合理些
	var noop = function() {};
	var prepareStackTrace = Error.prepareStackTrace;
	var req = require('http').IncomingMessage.prototype;
	var __defineGetter__ = req.__defineGetter__;
	req.__defineGetter__ = noop;
	var log = console.log;
	console.log = noop;
	require('weinre').run({
		boundHost: 'localhost',
		httpPort: parseInt(config.weinreport, 10),
		verbose: false,
		debug: false,
		readTimeout: 5,
		deathTimeout: 15
	});
	req.__defineGetter__ = __defineGetter__;
	console.log = log;
	Error.prepareStackTrace = prepareStackTrace;
};