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
var MAX_TEMP_SIZE = 1024 * 1024 * 12;
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

function getFile(filename, cb) {
  statRetry(filename, function(err, stat) {
    if (err ? err.code === 'ENOENT' : !stat.isFile()) {
      return cb();
    }
    if (err) {
      return cb(err.message || 'Error');
    }
    if (stat.size > MAX_TEMP_SIZE) {
      return cb('File is too large to load.');
    }
    fs.readFile(filename, function(e, data) {
      if (e) {
        return cb(e.message || 'Error');
      }
      cb(null, data);
    });
  });
}

function getTempFiles(list, cb) {
  var len = list.length;
  if (!len) {
    return cb(list);
  }
  if (len > 11) {
    len = 11;
    list = list.slice(0, 11);
  }
  var result = [];
  var execCb = function() {
    --len;
    if (len === 0) {
      cb(result);
    }
  };
  list = list.forEach(function(filename) {
    if (!TEMP_FILE_RE.test(filename)) {
      return execCb();
    }
    filename = path.join(TEMP_FILES_PATH, filename);
    getFile(filename, function(err, data) {
      if (data) {
        result.push(data.toString('base64'));
      }
      execCb();
    });
  });
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
    var files = req.query.files;
    if (files && typeof files === 'string') {
      return getTempFiles(files.split(','), function(list) {
        res.json({ ec: 0, list: list });
      });
    }
    var filename = req.query.filename;
    if (TEMP_FILE_RE.test(filename)) {
      filename = path.join(TEMP_FILES_PATH, filename);
    }
    getFile(filename, function(em, data) {
      if (em) {
        return res.json({ ec: 2, em: em });
      }
      res.json({ ec: 0, value: data && data + '' });
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
