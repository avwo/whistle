var WebSocket = require('./WebSocket');
var WebSocketServer = require('./WebSocketServer');

function handleConnection(client, completeHandShake) {
  completeHandShake();
}

module.exports = function(server, proxy) {
  server = new WebSocketServer({ server: server });
  server.onConnect = handleConnection;
  return server;
};
