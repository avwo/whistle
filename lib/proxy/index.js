var net = require('net');
var tls = require('tls');
var url = require('url');
var parseReq = require('./parse-req');
var connect = require('./connect');
var util = require('../../util');

module.exports = function init(app) {
	var config = app.config;
	var server = net.createServer(function(socket) {
		var proxyReq;
		function destroy() {
			socket.destroy();
			proxyReq && proxyReq.destroy();
		}
		abortIfUnavailable(socket);
		
		function abortIfUnavailable(socket) {
			socket.on('error', destroy).on('close', destroy);
		}
		
		parseReq(socket, function(err, req) {
			if (err) {
				return destroy();
			}
			
			var options = req.headers[config.httpsProxyHost];
			options = options && url.parse('http://' + options);
			if (!options || !net.isIP(options.hostname)) {
				return destroy();
			}
			options.host = options.hostname;
			req.options = options;
			var host = req.headers.host;
			if (host && !/:\d*$/.test(host)) {
				req.headers.host = host.replace(/:\d*$/, '') + ':443';
			}
			connect(req, function(err, proxySocket) {
				if (err) {
					return destroy();
				}
				
				proxyReq = tls.connect({
			        rejectUnauthorized: false,
			        socket: proxySocket
			    }, function () {
			    	req.pipe(proxyReq);
			    	proxyReq.pipe(socket);
			    });
				abortIfUnavailable(proxyReq);
			});
		});
	})
		.listen(config.httpsproxyport, 'localhost');
};