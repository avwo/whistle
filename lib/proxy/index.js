var net = require('net');
var tls = require('tls');
var parseHeaders = require('./parse-headers');
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
		
		parseHeaders(socket, config, function(err, req) {
			if (err) {
				return closeAll()
			}
			
			connect(req, config, function(err, proxySocket) {
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
			});
		});
	})
	.listen(config.httpsproxyport, 'localhost')
	.on('error', util.noop);
};