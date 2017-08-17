var WebSocket = require('./WebSocket');
var WebSocketServer = require('./WebSocketServer');
var parseurl = require('parseurl');
var util = require('../util');
var config = require('../config');

function handleConnection(client, completeHandShake) {
  var req = client.upgradeReq;
  var headers = req.headers;
  var options = parseurl(req);
  req.isHttps = req.headers[config.HTTPS_FIELD];
  req.url = options.path;
  req.fullUrl = (req.isHttps ? 'wss://' : 'ws://') + headers.host + options.path;

  delete headers['sec-websocket-key'];

  var res = new WebSocket(req.fullUrl, {
    headers: headers,
    rejectUnauthorized: false
  });
  var closeAll = function() {
    setTimeout(function() {
      res.close();
      client.close();
    }, 1000);
  };
  var handleError = function() {
    completeHandShake();
    closeAll();
  };
  client.on('error', handleError);
  res.on('error', handleError);
  res.on('open', function() {
    completeHandShake();
    client.on('message', function(msg) {
      res.send(msg, util.noop);
    });
    res.on('message', function(msg) {
      client.send(msg, util.noop);
    });
  });
}

module.exports = function(server, proxy) {
  server = new WebSocketServer({ server: server });
  server.onConnect = handleConnection;
  return server;
};
