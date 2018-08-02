var util = require('util');
var path = require('path');
var http = require('http');
var url = require('url');
var extend = require('extend');
var iconv = require('iconv-lite');
var isUtf8 = require('../util/is-utf8');
var ca = require('../https/ca');
var Storage = require('../rules/storage');
var getServer = require('hagent').create(null, 40500);

var QUERY_RE = /\?.*$/;
var REQ_ID_RE = /^\d{13,15}-\d{1,5}$/;
var reqOpts, REQ_ID_HEADER, pending;
var reqCallbacks = {};
var resCallbacks = {};
var MAX_LENGTH = 100;
var TIMEOUT = 600;
var timer;

var toBuffer = function(base64) {
  if (base64) {
    try {
      return new Buffer(base64, 'base64');
    } catch(e) {}
  }
};
var getBuffer = function(item) {
  return toBuffer(item && item.base64);
};
var getText = function(item) {
  var body = toBuffer(item && item.base64) || '';
  if (body && !isUtf8(body)) {
    try {
      body = iconv.encode(body, 'GB18030');
    } catch(e) {}
  }
  return body + '';
};

var execCallback = function(id, cbs, item) {
  var cb = cbs[id];
  if (cbs === reqCallbacks || !item || item.endTime) {
    cb(item);
    delete cbs[id];
  }
};

var retryRequest = function() {
  if (!timer) {
    timer = setTimeout(request, TIMEOUT);
  }
};

var request = function() {
  clearTimeout(timer);
  timer = null;
  if (pending) {
    return;
  }
  var reqList = Object.keys(reqCallbacks);
  var resList = Object.keys(resCallbacks);
  if (!reqList.length && !resList.length) {
    return;
  }
  pending = true;
  var execCb = function(err, result) {
    pending = false;
    if (err || !result) {
      return retryRequest();
    }
    Object.keys(result).forEach(function(id) {
      var item = result[id];
      execCallback(id, reqCallbacks, item);
      execCallback(id, resCallbacks, item);
      retryRequest();
    });
  };
  var _reqList = reqList.slice(0, MAX_LENGTH);
  var _resList = resList.slice(0, MAX_LENGTH);
  var query = '?reqList=' + JSON.stringify(_reqList) + '&resList=' + JSON.stringify(_resList);

  reqOpts.path = reqOpts.path.replace(QUERY_RE, query);
  http.get(reqOpts, function(res) {
    if (res.statusCode !== 200) {
      return execCb(true);
    }
    var body;
    res.on('data', function(data) {
      body = body ? Buffer.concat([body, data]) : data;
    });
    res.on('end', function() {
      if (body) {
        try {
          return execCb(null, JSON.parse(String(body)));
        } catch(e) {}
      }
      execCb(true);
    });
  }).on('error', execCb);
};

var getReqId = function(req, fn) {
  if (!req || typeof fn !== 'function' || !req.headers) {
    return;
  }
  var reqId = req.headers[REQ_ID_HEADER];
  return REQ_ID_RE.test(reqId) ? reqId : null;
};

var getResponseData = function(req, cb, isReq) {
  var reqId = getReqId(req, cb);
  if (!reqId) {
    return;
  }
  if (isReq) {
    reqCallbacks[reqId] = cb;
  } else {
    resCallbacks[reqId] = cb;
  }
  retryRequest();
};

var getRequestData = function(req, cb) {
  getResponseData(req, cb, true);
};

var loadModule = function(filepath) {
  try {
    return require(filepath);
  } catch (e) {}
};

module.exports = function(options, callback) {
  options.getRootCAFile = ca.getRootCAFile;
  options.createCertificate = ca.createCertificate;
  options.Storage = Storage;
  options.storage = new Storage(path.join(options.config.baseDir, '.plugins', options.name));
  var config = options.config;
  REQ_ID_HEADER = options.REQ_ID_HEADER;
  reqOpts = url.parse('http://127.0.0.1:' + config.uiport + '/cgi-bin/get-item?');
  reqOpts.headers = { 'x-whistle-auth-key': config.authKey };
  delete config.authKey;
  if (options.debugMode) {
    var cacheLogs = [];
    /*eslint no-console: "off"*/
    console.log = function() {
      var msg = util.format.apply(this, arguments);
      if (cacheLogs) {
        cacheLogs.push(msg);
      } else {
        process.sendData({
          type: 'console.log',
          message: msg
        });
      }
    };
    process.on('data', function(data) {
      if (cacheLogs && data && data.type == 'console.log' && data.status == 'ready') {
        var _cacheLogs = cacheLogs;
        cacheLogs = null;
        _cacheLogs.forEach(function(msg) {
          process.sendData({
            type: 'console.log',
            message: msg
          });
        });
      }
    });
  }

  var port, statsPort, resStatsPort, uiPort, rulesPort, resRulesPort, tunnelRulesPort, tunnelPort;
  var count = 0;
  var callbackHandler = function() {
    if (--count <= 0) {
      callback(null, {
        port: port,
        statsPort: statsPort,
        resStatsPort: resStatsPort,
        uiPort: uiPort,
        rulesPort: rulesPort,
        resRulesPort: resRulesPort,
        tunnelRulesPort: tunnelRulesPort,
        tunnelPort: tunnelPort
      });
    }
  };

  try {
    require.resolve(options.value);
  } catch(e) {
    return callbackHandler();
  }
  var initial = loadModule(path.join(options.value, 'initial.js'));
  if (typeof initial === 'function') {
    initial(options);
  }
  var execPlugin = require(options.value);
  var startServer = execPlugin.pluginServer || execPlugin.server || execPlugin;
  if (typeof startServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startServer(server, options);
      port = _port;
      callbackHandler();
    });
  }

  var startStatsServer = execPlugin.statsServer || execPlugin.reqStatsServer;
  if (typeof startStatsServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startStatsServer(server, extend({
        getRequestData: getRequestData,
        getResponseData: getResponseData,
        getBuffer: getBuffer,
        getText: getText
      }, options));
      statsPort = _port;
      callbackHandler();
    });
  }

  var startResStatsServer = execPlugin.resStatsServer;
  if (typeof startResStatsServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startResStatsServer(server, extend({
        getRequestData: getRequestData,
        getResponseData: getResponseData,
        getBuffer: getBuffer,
        getText: getText
      }, options));
      resStatsPort = _port;
      callbackHandler();
    });
  }

  var startUIServer = execPlugin.uiServer || execPlugin.innerServer || execPlugin.internalServer;
  if (typeof startUIServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startUIServer(server, options);
      uiPort = _port;
      callbackHandler();
    });
  }

  var startRulesServer = execPlugin.pluginRulesServer || execPlugin.rulesServer || execPlugin.reqRulesServer;
  if (typeof startRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startRulesServer(server, options);
      rulesPort = _port;
      callbackHandler();
    });
  }

  var startResRulesServer = execPlugin.resRulesServer;
  if (typeof startResRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startResRulesServer(server, extend({
        getRequestData: getRequestData,
        getBuffer: getBuffer,
        getText: getText
      }, options));
      resRulesPort = _port;
      callbackHandler();
    });
  }

  var startTunnelRulesServer = execPlugin.pluginRulesServer || execPlugin.tunnelRulesServer;
  if (typeof startTunnelRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startTunnelRulesServer(server, options);
      tunnelRulesPort = _port;
      callbackHandler();
    });
  }

  var startTunnelServer = execPlugin.pluginServer || execPlugin.tunnelServer || execPlugin.connectServer;
  if (typeof startTunnelServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      startTunnelServer(server, options);
      tunnelPort = _port;
      callbackHandler();
    });
  }

  if (!count) {
    callbackHandler();
  }
};


