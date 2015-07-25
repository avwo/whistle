var socks = require('socksv5');
var tls = require('tls');
var url = require('url');
var util = require('./index');

module.exports = function connect(proxyOptions, callback) {
	var done;
	var options = url.parse(proxyOptions.url);
	var isHttps = /^(?:https|wss):$/.test(options.protocol);
	var auths = util.getAuths(proxyOptions);
	if (auths.length) {
		auths = auths.map(function(auth) {
			return socks.auth.UserPassword(auth.username, auth.password);
		});
	} else {
		auths.push(socks.auth.None());
	}
	
	try {
		return socks.connect({
			  host: options.hostname,
			  port: options.port || (isHttps ? 443 : 80),
			  proxyHost: proxyOptions.host,
			  proxyPort: proxyOptions.port || 1080,
			  auths: auths
			}, function(socket) {
				socket.on('error', util.noop);
				callback(null, isHttps ? tls.connect({
			        rejectUnauthorized: false,
			        socket: socket
			    }).on('error', util.noop) : socket);
			}).on('error', function(err) {
				!done && callback(err);
				done = true;
			});
	} catch(err) {//socksv5会限制一些参数的格式
		callback(err);
	}
}
