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
var setupDataCenter = require('./data-center');
var Limiter = require('async-limiter');
var gzip = require('zlib').gzip;


var saveData = setupDataCenter.saveData;
var forwardRequest = setupDataCenter.forwardRequest;

const limiter = new Limiter({ concurrency: 10 });
var TEMP_FILES_PATH;
var SAVED_SESSIONS_PATH;
var LIMIT_SIZE = 1024 * 1024 * 128;
var MAX_TEMP_SIZE = 1024 * 1024 * 12;
var TEMP_FILE_RE = /^[\da-f]{64}$/;
var jsonParser = bodyParser.json({ limit: LIMIT_SIZE });
var storage = multer.memoryStorage();
var INVALID_NAME_RE = /[\u001e\u001f\u200e\u200f\u200d\u200c\u202a\u202d\u202e\u202c\u206e\u206f\u206b\u206a\u206d\u206c'<>:"/|?*]+/g;
var SPACE_RE = /\s+/g;
var upload = multer({
  storage: storage,
  fieldSize: LIMIT_SIZE
});

process.on('data', saveData);

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

function getFilename(filename) {
  if (typeof filename === 'string') {
    return filename.replace(INVALID_NAME_RE, '').replace(SPACE_RE, ' ').substring(0, 64).trim();
  }
  return '';
}

function saveSessions(data, cb) {
  limiter.push((done) => {
    gzip(JSON.stringify(data.sessions), function(err, buf) {
      done();
      if (err) {
        return cb(err);
      }
      writeFile(path.join(SAVED_SESSIONS_PATH, getFilename(data.filename) + '.' + Date.now()), buf, cb);
    });
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
      return cb('File is too large to load');
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
  app.get('/service/index.html', forwardRequest);
  app.post('/cgi-bin/service/save', jsonParser, function(req, res) {
    saveData(req.body, function(err) {
      res.json({ec: err ? 2 : 0, em: err && err.message});
    });
  });
  app.post('/cgi-bin/sessions/save', jsonParser, function(req, res) {
    saveSessions(req.body, function(err) {
      res.json({ec: err ? 2 : 0, em: err ? err.message || 'Error' : undefined});
    });
  });

  var SESSIONS_FILE_RE = /\.(\d+)$/;
  app.get('/cgi-bin/sessions/saved-list', function(req, res) {
    fs.readdir(SAVED_SESSIONS_PATH, function(err, files) {
      if (err) {
        return res.json({ ec: 2, em: err.message } );
      }
      var list = [];
      files.forEach(function(file) {
        if (SESSIONS_FILE_RE.test(file)) {
          var time = RegExp.$1;
          list.push({
            filename: file.slice(0,  - time.length - 1),
            time: +time
          });
        }
      });
      res.json({ec: 0, list: list});
    });
  });
  app.get('/cgi-bin/sessions/remove-saved', function(req, res) {
    res.json([]);
  });
  app.get('/cgi-bin/sessions/saved-sessions', function(req, res) {
    var filename = getFilename(req.query.filename) + '.' + req.query.time;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip'
    });
    fs.createReadStream(path.join(SAVED_SESSIONS_PATH, filename))
      .on('error', function(err) {
        res.emit('error', err);
      })
      .pipe(res);
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
    jsonParser,
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
  SAVED_SESSIONS_PATH = options.SAVED_SESSIONS_PATH;
  setupDataCenter(options);
  getServer(function (server, port) {
    server.on('request', sessionsHandler());
    callback(null, { port: port });
  });
};
