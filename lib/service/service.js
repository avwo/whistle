var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer');
var util = require('./util');
var extractSaz = require('./extract-saz');
var generateSaz = require('./generate-saz');
var LIMIT_SIZE = 1024 * 1024 * 65;

var storage = multer.memoryStorage();
var upload = multer({
  storage: storage,
  fieldSize: LIMIT_SIZE
});

var MAX_PORT = 60000;
var curPort = 40000;

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
      return res.json([]);
    }
    if (/\.txt$/i.test(file.originalname)) {
      var sessions = util.parseJSON(file.buffer + '');
      return res.json(Array.isArray(sessions) ? sessions : []);
    }
    try {
      extractSaz(file.buffer, res.json.bind(res));
    } catch(e) {
      res.status(500).send(e.stack);
    }
  });
  app.use(bodyParser.urlencoded({ extended: true, limit: LIMIT_SIZE}));
  app.use(bodyParser.json());
  app.use('/cgi-bin/sessions/export', function(req, res) {
    var body = req.body;
    var type = body.exportFileType;
    var sessions = type === 'Fiddler' ? generateSaz(body) : body.sessions;
    res.attachment(util.getFilename(type)).send(sessions);
  });
  return app;
}

module.exports = function(options, callback) {
  getServer(function(server, port) {
    server.on('request', sessionsHandler());
    callback(null, { port: port });
  });
};
