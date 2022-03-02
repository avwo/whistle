var express = require('express');
var app = express();
var util = require('./util');

module.exports = function(server, options) {
  util.init(options);
  server.on('request', app);
  app.use(function(req, res, next) {
    req.on('error', next);
    res.on('error', next);
    req.setEncoding('utf8');
    var body = '';
    req.on('data', function(data) {
      body += data;
    });

    req.on('end', function() {
      res.end();
    });
  });

  app.use(function(err, req, res, next) {
    res.sendStatus(500);
  });
};