var net = require('net');
var parseHeaders = require('./parse-headers');
var connect = require('./connect');

var server = net.createServer(function(socket) {
	parseHeaders(socket, function(err, res) {
		connect(res);
	});
})
.listen(config.httpsproxyport, 'localhost')
.on('error', util.noop);