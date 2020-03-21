require('../util/patch');
var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer2');
var util = require('./util');
var extractSaz = require('./extract-saz');
var generateSaz = require('./generate-saz');
var getServer = require('hagent').getServer;

var SESSIONS_FILE_RE = /\.(txt|json|saz)$/i;
var LIMIT_SIZE = 1024 * 1024 * 128;
var storage = multer.memoryStorage();
var upload = multer({
  storage: storage,
  fieldSize: LIMIT_SIZE
});

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
    var suffix;
    if (file && SESSIONS_FILE_RE.test(file.originalname)) {
      suffix = RegExp.$1.toLowerCase();
    }
    if (!suffix || !Buffer.isBuffer(file.buffer)) {
      return res.json([]);
    }
    if (suffix !== 'saz') {
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
    res.attachment(util.getFilename(type, body.exportFilename)).send(sessions);
  });
  return app;
}

module.exports = function(_, callback) {
  getServer(function(server, port) {
    server.on('request', sessionsHandler());
    callback(null, { port: port });
  });
};
