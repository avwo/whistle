require('../util/patch');
var express = require('express');
var fork = require('pfork').fork;
var bodyParser = require('body-parser');
var multer = require('multer2');
var fs = require('fs');
var fse = require('fs-extra2');
var path = require('path');
var gzip = require('zlib').gzip;
var util = require('./util');
var extractSaz = require('./extract-saz');
var generateSaz = require('./generate-saz');
var getServer = require('hagent').getServer;
var dataCenter = require('./data-center');
var composer = require('./composer');
var handleComposeData = require('./compose-data');
var Limiter = require('async-limiter');
var common = require('../util/common');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

var saveData = dataCenter.saveData;
var shareData = dataCenter.shareData;
var requestData = dataCenter.requestData;
var forwardRequest = dataCenter.forwardRequest;

var INSTALL_SCRIPT = path.join(__dirname, 'install.js');
var installChild;

var TEMP_PLUGINS_PATH = path.join(common.getWhistlePath(), '.temp_plugins');
var SESSIONS_FILE_RE = /\.(txt|json|saz)$/i;
var limiter = new Limiter({ concurrency: 10 });
var MAX_PLUGINS = 10;
var TEMP_FILES_PATH;
var SAVED_SESSIONS_PATH;
var LIMIT_SIZE = 1024 * 1024 * 128;
var MAX_TEMP_SIZE = 1024 * 1024 * 12;
var MAX_PLUGIN_SIZE = MAX_TEMP_SIZE;
var MAX_TEMP_PLUGINS_AGE = 1000 * 60 * 10; // 10 minutes
var TEMP_FILE_RE = /^[\da-f]{64}$/;
var CR = '\r';
var jsonParser = bodyParser.json({ limit: LIMIT_SIZE });
var urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '1mb'});
var PLUGIN_SEP = /\s*,\s*/;
var config;
var curWhistleId;
var hasWhistleToken;
var whistleIdFile;
var storage = multer.memoryStorage();
var INVALID_NAME_RE = /[\u001e\u001f\u200e\u200f\u200d\u200c\u202a\u202d\u202e\u202c\u206e\u206f\u206b\u206a\u206d\u206c'<>:"\\/|?*]+/g;
var SPACE_RE = /\s+/g;
var upload = multer({
  storage: storage,
  fieldSize: LIMIT_SIZE
});
var promises = {};
var hasTempPluginsDir;

var ensureTempPluginsDir = function() {
  if (!hasTempPluginsDir) {
    try {
      fse.ensureDirSync(TEMP_PLUGINS_PATH);
      hasTempPluginsDir = true;
    } catch (e) {}
  }
};

ensureTempPluginsDir();

process.on('data', function(data) {
  if (data) {
    if (data.type === 'whistleId') {
      curWhistleId = data.whistleId;
      hasWhistleToken = data.hasWhistleToken;
    } else {
      saveData(data);
    }
  }
});

function getFilename(filename, time, count) {
  filename = common.isString(filename) ? filename.replace(INVALID_NAME_RE, '').replace(SPACE_RE, ' ').substring(0, 64).trim() : '';
  time = time || Date.now();
  return common.getMonth(time) + '/' + filename + '_' + count + '_' + time;
}

function saveSessions(data, cb) {
  var count = Array.isArray(data.sessions) && data.sessions.length;
  if (!count) {
    return cb();
  }
  limiter.push(function (done) {
    gzip(JSON.stringify(data.sessions), function(err, buf) {
      done();
      if (err) {
        return cb(err);
      }
      var filename = getFilename(data.filename, 0, count);
      util.writeFile(path.join(SAVED_SESSIONS_PATH, filename), buf, function(e) {
        !e && saveData({ type: 'savedData', filename: filename, buffer: buf } );
        cb(e);
      });
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
  common.getStat(filename, function(err, stat) {
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

function handleError(clientId, e) {
  if (clientId) {
    e = (typeof e === 'string' ? e : e && e.message) || 'Install failed';
    process.sendData({ type: 'error', error: e.substring(0, 512), clientId: clientId });
  }
}

function writeTempPlugin(plugin, data, cb) {
  if (!data) {
    return cb();
  }
  plugin = plugin.split('/').pop();
  var tempPath = path.join(TEMP_PLUGINS_PATH, plugin);
  ensureTempPluginsDir();
  util.writeFile(tempPath, data, function(e) {
    cb(e, e ? null : tempPath);
  });
}

function cleanTempPlugins() {
  fs.readdir(TEMP_PLUGINS_PATH, function(err, files) {
    setTimeout(cleanTempPlugins, MAX_TEMP_PLUGINS_AGE);
    if (err) {
      return;
    }
    var now = Date.now();
    files.forEach(function(file) {
      if (!common.TGZ_FILE_NAME_RE.test(file)) {
        return;
      }
      fs.stat(path.join(TEMP_PLUGINS_PATH, file), function(err, stats) {
        if (err) {
          return;
        }
        if (Math.abs(now - stats.mtime.getTime()) < MAX_TEMP_PLUGINS_AGE) {
          return;
        }
        fs.unlink(path.join(TEMP_PLUGINS_PATH, file), common.noop);
      });
    });
  });
}

cleanTempPlugins();

function loadTgzPlugins(clientId, tgzPlugins, cb) {
  var len = tgzPlugins.length;
  if (!len) {
    return cb();
  }
  var result = [];
  var execCb = function() {
    if (--len === 0) {
      cb(result);
    }
  };

  tgzPlugins.forEach(function(plugin) {
    var p = promises[plugin];
    if (p) {
      // 同一 plugin 避免重复请求
      return p.then(execCb);
    }
    promises[plugin] = new Promise(function(resolve) {
      requestData({
        url: '/service/cgi/plugin?name=' + encodeURIComponent(plugin),
        maxLength: MAX_PLUGIN_SIZE,
        responseType: 'buffer',
        strictMode: true
      }, function(err, data) {
        writeTempPlugin(plugin, data, function(e, file) {
          file && result.push('file:' + file);
          execCb();
          err = err || e;
          err && handleError(clientId, err.message || 'Install plugin \'' + plugin + '\' failed');
          delete promises[plugin];
          resolve();
        });
      });
    });
  });
}

function execInstallPlugins(argv, clientId) {
  if (installChild) {
    return installChild.sendData({ type: 'installPlugins', argv: argv, clientId: clientId });
  }
  fork({
    script: INSTALL_SCRIPT,
    debugMode: config.debugMode
  }, function (err, _, child) {
    if (err) {
      return handleError(clientId, err);
    }
    installChild = child;
    child.once('close', function () {
      installChild = null;
    });
    child.on('data', function (data) {
      if (data && data.type === 'error') {
        return handleError(data.clientId, data.data);
      }
    });
    installChild.sendData({ type: 'installPlugins', argv: argv, clientId: clientId });
  });
}

function installPlugins(data, clientId) {
  var argv = data.pkgs.map(function(item) {
    return item.name + (item.version ? '@' + item.version : '');
  });
  if (data.whistleDir) {
    argv.push('--dir=' + data.whistleDir);
  }
  if (data.registry) {
    argv.push('--registry=' + data.registry);
  }
  execInstallPlugins(argv, clientId);
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
  app.get('/service/*', forwardRequest);
  app.post('/cgi-bin/service/save', jsonParser, function(req, res) {
    if (util.isShareType(req.body.type)) {
      shareData(req.body, function(err, data) {
        res.json(err ? {ec: 2, data, em: err.message || 'Error'} : data);
      });
      return;
    }
    saveData(req.body);
    res.json({ec: 0});
  });
  app.post('/cgi-bin/service/login', jsonParser, function(req, res) {
    requestData({
      method: 'POST',
      url: '/service/cgi/login',
      strictMode: true,
      headers: {
        'content-type': 'application/json'
      },
      body: req.body
    }, function(err, data) {
      if (err) {
        return res.json({ec: 2, em: err.message || 'Error'});
      }
      config.whistleId = data.whistleId;
      config.whistleToken = data.token;
      process.sendData({ type: 'whistleIdChange', whistleId: data.whistleId, hasWhistleToken: !!data.token });
      res.json({ec: 0});
      try {
        var text = common.encryptAES(data.whistleId + CR + data.token + CR + Date.now(), config.clientId, config.clientIdNo);
        fs.writeFile(whistleIdFile, text, function(e) {
          if (e) {
            fs.writeFile(whistleIdFile, text, common.noop);
          }
        });
      } catch (e) {}
    });
  });
  app.post('/cgi-bin/plugins/install', urlencodedParser, function(req, res) {
    var plugins = req.body.plugins;
    var clientId = req.body.clientId;
    plugins = common.isString(plugins) ? plugins.trim().split(PLUGIN_SEP) : null;
    plugins = plugins && common.getPlugins(plugins, true);
    var count = plugins ? plugins.length : 0;
    if (count) {
      if (count > MAX_PLUGINS) {
        plugins = plugins.slice(0, MAX_PLUGINS);
        count = MAX_PLUGINS;
      }
      var curTgzPlugins = [];
      plugins = plugins.filter(function(name) {
        if (!name.indexOf('file:')) {
          curTgzPlugins.push(name.substring(5));
          return false;
        }
        return true;
      });
      loadTgzPlugins(clientId, curTgzPlugins, function(tgzPlugins) {
        plugins = plugins.concat(tgzPlugins);
        if (!plugins.length) {
          return;
        }
        var registry = common.getRegistry(req.body.registry);
        if (config.hasInstaller) {
          var pkgs = plugins.map(function(name) {
            if (common.WHISTLE_PLUGIN_RE.test(name)) {
              return {
                name: RegExp.$1,
                version: RegExp.$2
              };
            }
            return { name: name };
          });
          process.sendData({ type: 'installPlugins', data: {
            registry: registry,
            pkgs: pkgs
          } });
        } else {
          registry && plugins.push('--registry=' + registry);
          execInstallPlugins(plugins, clientId);
        }
      });
      return res.json({ ec: 0, count: count });
    }
    var data = common.parsePlugins(req.body);
    if (data) {
      if (config.hasInstaller) {
        process.sendData({ type: 'installPlugins', data: data });
      } else {
        installPlugins(data, clientId);
      }
    }
    res.json({ ec: 0, count: data ? data.pkgs.length : 0 });
  });
  app.post('/cgi-bin/service/logout', function(req, res) {
    config.whistleId = undefined;
    config.whistleToken = undefined;
    process.sendData({ type: 'whistleIdChange' });
    res.json({ec: 0});
  });
  app.post('/cgi-bin/saved/save', jsonParser, function(req, res) {
    saveSessions(req.body, function(err) {
      res.json({ec: err ? 2 : 0, em: err ? err.message || 'Error' : undefined});
    });
  });
  app.post('/cgi-bin/composer', jsonParser, composer.handleRequest);
  app.get('/cgi-bin/compose-data', handleComposeData);
  '';
  app.get('/cgi-bin/saved/list', function(req, res) {
    util.getSavedList(SAVED_SESSIONS_PATH, function(err, list) {
      if (err) {
        return res.json({ ec: 2, em: err.message } );
      }
      common.sendGzip(req, res, { ec: 0, list: list });
    });
  });
  app.post('/cgi-bin/saved/remove', jsonParser, function(req, res) {
    var filename = getFilename(req.body.filename, +req.body.time, +req.body.count);
    fs.unlink(path.join(SAVED_SESSIONS_PATH, filename), function(err) {
      dataCenter.removeSavedData(filename.substring(filename.indexOf('/') + 1));
      if (err && err.code !== 'ENOENT') {
        return res.json({ ec: 2, em: err.message });
      }
      res.json({ ec: 0 });
    });
  });
  app.get('/cgi-bin/saved/sessions', function(req, res) {
    var filename = getFilename(req.query.filename, +req.query.time, +req.query.count);
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
  app.get('/cgi-bin/temp/get', function(req, res) {
    var files = req.query.files;
    if (files && typeof files === 'string') {
      return getTempFiles(files.split(','), function(list) {
        common.sendGzip(req, res, { ec: 0, list: list });
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
      common.sendGzip(req, res, { ec: 0, value: data && data + '' });
    });
  });
  app.get('/cgi-bin/history', composer.getHistory);
  app.use('/cgi-bin/temp/create',
    jsonParser,
    function(req, res) {
      util.writeTempFile(TEMP_FILES_PATH, getContent(req.body), function(e, filename) {
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
        return common.sendGzip(req, res, Array.isArray(sessions) ? sessions : []);
      }
      try {
        extractSaz(file.buffer, function (data) {
          common.sendGzip(req, res, data);
        });
      } catch (e) {
        common.sendRes(req, 500, e.stack);
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
        return common.sendRes(res, 500, e.stack);
      }
      download(body);
    });
  });
  return app;
}

function updateWhistleId() {
  if (config && (config.whistleId !== curWhistleId || !config.whistleToken !== !hasWhistleToken)) {
    process.sendData({ type: 'whistleIdChange', whistleId: config.whistleId, hasWhistleToken: !!config.whistleToken });
  }
}

var preList;
(function updateSystyemInfo() {
  var curList = [];
  var isChanged = !preList;
  common.walkInterfaces(function (info) {
    var addr = info.address.toLowerCase();
    curList.push(addr);
    isChanged = isChanged || preList.indexOf(addr) === -1;
  });
  isChanged = isChanged || curList.length !== preList.length;
  preList = curList;
  if (isChanged && process.sendData) {
    process.sendData({ type: 'w2NetworkInterfacesChange' });
  }
  updateWhistleId();
  setTimeout(updateSystyemInfo, 2000);
})();

function checkLogin(whistleId, token) {
  if (!whistleId || !token) {
    return;
  }
  // config.whistleId = whistleId;
  setTimeout(function() {
    // config.whistleToken = token;
    updateWhistleId();
  }, 2000);
}

function readWhistleLoginFile(file) {
  try {
    var text = common.decryptAES(common.readFileTextSync(file).trim(), config.clientId, config.clientIdNo).split(CR);
    return text.length === 3 && text;
  } catch (e) {}
}

function checkWhistleId(cb) {
  var text = config.disableWebUI ? null
    : readWhistleLoginFile(whistleIdFile) || (config.storage && readWhistleLoginFile(path.join(config.baseDir, '.whistle_id')));
  text && checkLogin(text[0], text[1]);
  cb();
}

module.exports = function (options, callback) {
  config = options;
  whistleIdFile = path.join(options.baseDir, options.storage || '', '.whistle_id');
  TEMP_FILES_PATH = options.TEMP_FILES_PATH;
  SAVED_SESSIONS_PATH = options.SAVED_SESSIONS_PATH;
  dataCenter.setup(options);
  composer.setup(options);
  checkWhistleId(function() {
    getServer(function (server, port) {
      server.on('request', sessionsHandler());
      callback(null, { port: port, whistleId: config.whistleId });
    });
  });
};
