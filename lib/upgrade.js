var handleWebsocket = require('./https').handleWebsocket;
var hparser = require('hparser');
var Buffer = require('safe-buffer').Buffer;
var util = require('./util');
var config = require('./config');

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
  var clientPort = util.getClientPort(socket);
  var clientIp = util.getClientIp(socket);
  delete socket.headers[config.CLIENT_PORT_HEAD];
  socket.getBuffer = function(headers, path) {
    var rawData = ['GET' + ' ' + (path || req.url) + ' ' + 'HTTP/1.1'];
    headers = formatHeaders(headers || req.headers, req.rawHeaders);
    rawData.push(getRawHeaders(headers));
    return Buffer.from(rawData.join('\r\n') + '\r\n\r\n');
  };
  handleWebsocket(socket, clientIp, clientPort, function(err, svrSocket) {
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
