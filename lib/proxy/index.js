var net = require('net');
var parseHeaders = require('./parse-headers');
var connect = require('./connect');
var util = require('../../util');
var config = util.config;

var server = net.createServer(function(socket) {
	parseHeaders(socket, function(err, res) {
		if (err) {
			return;
		}
		connect(res, function(err, proxySocket) {
			if (err) {
				return;
			}
			 var proxyReq = tls.connect({
			        rejectUnauthorized: false,
			        socket: proxySocket
			    }, function () {
			    	proxySocket.pipe(proxyReq).pipe(socket);
			    }).on('error', destroy);
			 
			 proxySocket.on('error', destroy);
			 function destroy() {
				 proxyReq.destroy();
			 }
		});
	});
})
.listen(config.httpsproxyport, 'localhost')
.on('error', util.noop);