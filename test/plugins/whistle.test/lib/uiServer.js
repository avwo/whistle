var express = require('express');
var app = express();
var WebSocketServer = require('ws').Server;
var util = require('./util');

function startWebsocketServer(ws) {
  ws.on('connection', function(ws) {
    var req = ws.upgradeReq;
    ws.on('message', function(msg) {
      ws.send(JSON.stringify({
        headers: req.headers,
        body: msg
      }, null, '\t'));
    });
  });
}

module.exports = function(server, options) {
  util.init(options);
  server.on('request', app);
  startWebsocketServer(new WebSocketServer({ server: server }));
  app.use(function(req, res, next) {
    req.on('error', next);
    res.on('error', next);
    
    res.end('uiServer');
  });
  
  app.use(function(err, req, res, next) {
    res.sendStatus(500);
  });
};