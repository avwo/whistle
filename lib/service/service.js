require('../util/patch');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer2');
var fs = require('fs');
var path = require('path');
var Buffer = require('safe-buffer').Buffer;
var util = require('./util');
var extractSaz = require('./extract-saz');
var generateSaz = require('./generate-saz');
var getServer = require('hagent').getServer;

var SESSIONS_FILE_RE = /\.(txt|json|saz)$/i;
var TEMP_FILES_PATH;
var LIMIT_SIZE = 1024 * 1024 * 128;
var MAX_TEMP_SIZE = 1024 * 1024 * 10;
var TEMP_FILE_RE = /^[\da-f]{64}$/;
var storage = multer.memoryStorage();
var upload = multer({
  storage: storage,
  fieldSize: LIMIT_SIZE
});

function statRetry(filepath, callback, retry) {
  fs.stat(filepath, function(e, stat) {
    if (!e || retry) {
      return callback(e, stat);
    }
    statRetry(filepath, callback, true);
  });
}

function writeRetry(filepath, data, callback, retry) {
  fs.writeFile(filepath, data, function(e) {
    if (!e || retry) {
      return callback(e);
    }
    writeRetry(filepath, data, callback, true);
  });
}

function writeFile(filepath, data, callback) {
  statRetry(filepath, function(e, stat) {
    if (!stat || !stat.isFile()) {
      return writeRetry(filepath, data, callback);
    }
    callback();
  });
}

function getContent(options) {
  var value = options.value;
  if (value && typeof value === 'string') {
    return value;
  }
  var base64 = options.base64;
  if (base64) {
    try {
      return Buffer.from(base64, 'base64');
    } catch(e) {}
  }
  return '';
}

function sessionsHandler() {
  var app = express();
  app.use(function (req, res, next) {
    req.on('error', abort);
    res.on('error', abort);
    function abort() {
      res.destroy();
    }
    next();
  });
  app.get('/cgi-bin/sessions/get-temp-file', function(req, res) {
    var filename = req.query.filename;
    if (!TEMP_FILE_RE.test(filename)) {
      return res.json({ ec: 0 });
    }
    filename = path.join(TEMP_FILES_PATH, filename);
    statRetry(filename, function(err, stat) {
      if (err ? err.code === 'ENOENT' : !stat.isFile()) {
        return res.json({ ec: 0 });
      }
      if (err) {
        return res.json({ ec: 2, em: err.message || 'Error' });
      }
      if (stat.size > MAX_TEMP_SIZE) {
        return res.json({ ec: 0, em: 'File is too large to load.' });
      }
      fs.readFile(filename, function(e, data) {
        if (e) {
          return res.json({ ec: 2, em: e.message || 'Error' });
        }
        res.json({ ec: 0, value: data + '' });
      });
    });
  });
  app.use('/cgi-bin/sessions/create-temp-file',
    bodyParser.json({ limit: 1024 * 1024 * 72 }),
    function(req, res) {
      var value = getContent(req.body);
      var filename = util.getHexHash(value);
      writeFile(path.join(TEMP_FILES_PATH, filename), value, function(e) {
        if (e) {
          return res.json({ ec: 2, em: e.message });
        }
        res.json({ ec: 0, filepath: 'temp/' + filename });
      });
    }
  );
  app.use(
    '/cgi-bin/sessions/import',
    upload.single('importSessions'),
    function (req, res) {
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
      } catch (e) {
        res.status(500).send(e.stack);
      }
    }
  );
  app.use(bodyParser.urlencoded({ extended: true, limit: LIMIT_SIZE }));
  app.use(bodyParser.json());
  app.use('/cgi-bin/sessions/export', function (req, res) {
    var body = req.body;
    var type = body.exportFileType;
    var download = function(content) {
      res.attachment(util.getFilename(type, body.exportFilename)).send(content || body.sessions);
    };
    if (type !== 'Fiddler') {
      return download();
    }
    generateSaz(body, function(e, body) {
      if (e) {
        return res.status(500).send(e.stack);
      }
      download(body);
    });
  });
  return app;
}

module.exports = function (options, callback) {
  TEMP_FILES_PATH = options.TEMP_FILES_PATH;
  getServer(function (server, port) {
    server.on('request', sessionsHandler());
    callback(null, { port: port });
  });
};
