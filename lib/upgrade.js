
var crypto = require('crypto');
var handleWebsocket = require('./https').handleWebsocket;

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
  socket.rawHeaders = req.rawHeaders;
  req.headers['sec-websocket-version'] = 13;
  req.headers['sec-websocket-key'] = crypto.randomBytes(16).toString('base64');
  handleWebsocket(socket, null, null, function(err, svrSocket) {
    reqSocket = svrSocket;
    if (err) {
      return destroy(err);
    }
    svrSocket.on('error', destroy);
  });
}

module.exports = function(server, proxy) {
  server.on('upgrade', upgradeHandler);
};
