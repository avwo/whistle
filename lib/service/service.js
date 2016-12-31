var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

var MAX_PORT = 55000;
var curPort = 50000;

function getServer(callback) {
  if (curPort > MAX_PORT) {
    curPort = 40000;
  }

  var server = http.createServer();
  var port = curPort++;
  var next = function() {
    getServer(callback);
  };
  server.on('error', next);
  server.listen(port, function() {
    server.removeListener('error', next);
    callback(server, port);
  });
}

function sessionsHandler() {
  var app = express();
  app.use(function(req, res, next) {
    req.on('error', abort);
    res.on('error', abort);
    function abort() {
      res.destroy();
    }
    next();
  });
  app.use(bodyParser.urlencoded({ extended: true, limit: '512mb'}));
  app.use(bodyParser.json());
  app.use(function(req, res, next) {
    res.end(req.body.exportFileType + '\n' + req.body.sessions);
  });
  return app;
}

module.exports = function(options, callback) {
  getServer(function(server, port) {
    server.on('request', sessionsHandler());
    callback(null, {
      impExpPort: port
    });
  });
};