var net = require('net');
var config = require('../package.json');

function close() {
  this.destroy();
}

module.exports = function(server, options) {
  server.on('connect', function(req, socket) {
    socket.on('error', close);
    if (req.headers[options.RULE_VALUE_HEADER] != 'none') {
      throw new Error('wrong rule value');
    }
    var resSocket = net.connect({
      port: 8080,
      host: '127.0.0.1'
    }, function() {
      socket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: ' + config.name + '\r\n\r\n');
      socket.pipe(resSocket).pipe(socket);
      resSocket.on('error', close);
    });
  });
};