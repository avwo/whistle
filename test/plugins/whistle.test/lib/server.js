var express = require('express');
var app = express();
var WebSocketServer = require('ws').Server;
var StringDecoder = require('string_decoder').StringDecoder;
var qs = require('querystring');
var util = require('./util');
var RES_BODY_RE = /\?resBody=([^&#]*)/;

function startHttpServer(app) {
  app.use(function(req, res, next) {
    req.on('error', next);
    res.on('error', next);

    var body = '';
    var decoder = new StringDecoder('utf8'); 
    req.on('data', function(data) {
      body += decoder.write(data);
    });
    req.on('end', function() {
      body += decoder.end();
      var fullUrl = util.getFullUrl(req);
      if (RES_BODY_RE.test(fullUrl)) {
        res.end(qs.unescape(RegExp.$1));
      } else {
        res.end(JSON.stringify({
          url: fullUrl,
          method: req.method,
          headers: req.headers,
          ruleValue: util.getRuleValue(req),
          host: util.getHost(req),
          port: util.getPort(req),
          body: body
        }, null, '\t'));
      }
    });
  });

  app.use(function(err, req, res, next) {
    res.sendStatus(500);
  });
}

function startWebsocketServer(ws) {
  ws.on('connection', function(ws) {
    var req = ws.upgradeReq;
    ws.on('message', function(msg) {
      ws.send(JSON.stringify({
        url: util.getFullUrl(req),
        method: req.method,
        headers: req.headers,
        ruleValue: util.getRuleValue(req),
        host: util.getHost(req),
        port: util.getPort(req),
        body: msg
      }, null, '\t'));
    });
  });
}

module.exports = function(server, options) {
  util.init(options);
  server.on('request', app);
  startHttpServer(app);
  startWebsocketServer(new WebSocketServer({ server: server }));
};