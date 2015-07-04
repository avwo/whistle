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
		function closeAll() {
			socket.destroy();
			proxyReq && proxyReq.destroy();
		}
		abortIfUnavailable(socket);
		
		function abortIfUnavailable(socket) {
			socket.on('error', closeAll).on('close', closeAll);
		}
		
		parseReq(socket, function(err, req) {
			if (err) {
				return closeAll();
			}
			
			var options = req.headers[config.httpsProxyHost];
			options = options && url.parse('http://' + options);
			if (!options || !net.isIP(options.hostname)) {
				return closeAll();
			}
			options.host = options.hostname;
			req.options = options;
			
			connect(req, function(err, proxySocket) {
				if (err) {
					return closeAll()
				}
				
				proxyReq = tls.connect({
			        rejectUnauthorized: false,
			        socket: proxySocket
			    }, function () {
			    	req.pipe(proxyReq);
			    	proxyReq.pipe(socket);
			    });
				abortIfUnavailable(proxyReq);
			}, config.port);
		});
	})
	.listen(config.httpsproxyport, 'localhost')
	.on('error', util.noop);
};