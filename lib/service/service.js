var http = require('http');
var express = require('express');
var AdmZip = require('adm-zip');
var bodyParser = require('body-parser');
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({
  storage: storage,
  fieldSize: 1024 * 1024 * 65
});
var TYPES = ['whistle', 'Fiddler2', 'Fiddler4'];


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

function padding(num) {
  return num < 10 ? '0' + num : num;
}

function getFilename(type) {
  if (!~TYPES.indexOf(type)) {
    type = 'whistle'
  }
  var date = new Date();
  var filename = [date.getFullYear(), padding(date.getMonth() + 1), padding(date.getDate())].join('-')
    + '_' + [padding(date.getHours()), padding(date.getMinutes()), padding(date.getSeconds())].join('-');
  return filename + '_' + type + (type === 'whistle' ? '.txt' : '.saz');
}

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch(e) {}
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
      var sessions = parseJSON(file.buffer + '');
      return res.json({ ec: 0, sessions: Array.isArray(sessions) ? sessions : [] }); 
    }
    try {
      var zip = new AdmZip(file.buffer);
      var zipEntries = zip.getEntries();
      zipEntries = zipEntries.map(function(entry) {
        return entry.isDirectory ? null : {
          name: entry.entryName,
          value: zip.readAsText(entry.entryName)
        };
      });
      res.json(zipEntries);
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
  app.use('/cgi-bin/sessions/export', function(req, res, next) {
    res.attachment(getFilename(req.body.exportFileType))
      .send(req.body.sessions);
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