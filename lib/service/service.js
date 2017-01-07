var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer');
var util = require('./util');
var extractSaz = require('./extract-saz');
var generateSaz = require('./generate-saz');

var storage = multer.memoryStorage();
var upload = multer({
  storage: storage,
  fieldSize: 1024 * 1024 * 65
});

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
  app.use('/cgi-bin/sessions/import', upload.single('importSessions'), function(req, res) {
    var file = req.file;
    if (!file || !/\.(txt|saz)$/i.test(file.originalname) || !Buffer.isBuffer(file.buffer)) {
      return res.json({ ec: 0, sessions: [] });
    }
    if (/\.txt$/i.test(file.originalname)) {
      var sessions = util.parseJSON(file.buffer + '');
      return res.json({ ec: 0, sessions: Array.isArray(sessions) ? sessions : [] }); 
    }
    try {
      res.json(extractSaz(file.buffer));
    } catch(e) {
      res.status(500).send(e.stack);
    }
  });
  app.use(bodyParser.urlencoded({ extended: true, limit: '512mb'}));
  app.use(bodyParser.json());
  app.post('/cgi-bin/sessions/import', function(req, res) {
    var buffer;
    req.on('data', function(chunk) {
      buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
    });
    req.on('end', function() {
      res.end(buffer);
    });
  });
  app.use('/cgi-bin/sessions/export', function(req, res) {
    var sessions = generateSaz(req.body);
    if (sessions === false) {
      sessions =  util.parseJSON(req.body.sessions) || '';
    }
    res.attachment(util.getFilename(req.body.exportFileType)).send(sessions);
  });
  return app;
}

module.exports = function(options, callback) {
  getServer(function(server, port) {
    server.on('request', sessionsHandler());
    callback(null, { port: port });
  });
};