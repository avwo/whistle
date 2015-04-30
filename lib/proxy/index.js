var net = require('net');
var tls = require('tls');
var parseHeaders = require('./parse-headers');
var connect = require('./connect');
var util = require('../../util');
var config = util.config;

var server = net.createServer(function(socket) {
	parseHeaders(socket, function(err, req) {
		if (!err) {
			connect(req, function(err, proxySocket) {
				if (!err) {
					var proxyReq = tls.connect({
				        rejectUnauthorized: false,
				        socket: proxySocket
				    }, function () {
				    	req.pipe(proxyReq);
				    	proxyReq.pipe(socket);
				    }).on('error', function() {
				    	proxyReq.destroy();
				    });
				}
			});
		}
	});
})
.listen(config.httpsproxyport, 'localhost')
.on('error', util.noop);