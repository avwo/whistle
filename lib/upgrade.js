var handleWebsocket = require('./https').handleWebsocket;
var hparser = require('hparser');
var formatHeaders = hparser.formatHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var getRawHeaders = hparser.getRawHeaders;

function upgradeHandler(req, socket) {
  var reqSocket;
  var destroyed;
  function destroy(err) {
    if (destroyed) {
      return;
    }
    destroyed = true;
    socket.destroy(err);
    reqSocket && reqSocket.destroy();
  }
  socket.on('error', destroy);
  socket.headers = req.headers;
  socket.rawHeaderNames = getRawHeaderNames(req.rawHeaders);
  socket.url = req.url;
  socket.getBuffer = function(headers, path) {
    var rawData = ['GET' + ' ' + (path || req.url) + ' ' + 'HTTP/1.1'];
    headers = formatHeaders(headers || req.headers, req.rawHeaders);
    rawData.push(getRawHeaders(headers));
    return new Buffer(rawData.join('\r\n') + '\r\n\r\n');
  };
  handleWebsocket(socket, null, null, function(err, svrSocket) {
    reqSocket = svrSocket;
    if (err) {
      return destroy(err);
    }
    svrSocket.on('error', destroy);
  });
}

module.exports = function(server) {
  server.on('upgrade', upgradeHandler);
};
