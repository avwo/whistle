var util = require('util');
var path = require('path');
var http = require('http');
var url = require('url');
var iconv = require('iconv-lite');
var isUtf8 = require('../util/is-utf8');
var ca = require('../https/ca');
var Storage = require('../rules/storage');
var getServer = require('hagent').create(null, 40500);

var QUERY_RE = /\?.*$/;
var REQ_ID_RE = /^\d{13,15}-\d{1,5}$/;
var reqOpts, pending;
var reqCallbacks = {};
var resCallbacks = {};
var MAX_LENGTH = 100;
var TIMEOUT = 300;
var timer;
var pluginOpts;

var getValue = function(req, name) {
  const value = req.headers[name];
  try {
    return value ? decodeURIComponent(value) : '';
  } catch(e) {}
  return '';
};
var parseInfo = function(req) {
  req.id = getValue(req, pluginOpts.REQ_ID_HEADER);
  req.ruleValue = getValue(req, pluginOpts.RULE_VALUE_HEADER);
  req.url = req.fullUrl = getValue(req, pluginOpts.FULL_URL_HEADER);
  req.realUrl = getValue(req, pluginOpts.REAL_URL_HEADER);
  req.method = getValue(req, pluginOpts.METHOD_HEADER);
  req.clientIp = getValue(req, pluginOpts.CLIENT_IP_HEADER) || '127.0.0.1';
  req.serverIp = getValue(req, pluginOpts.HOST_IP_HEADER);
  req.statusCode = getValue(req, pluginOpts.STATUS_CODE_HEADER);
};
var toBuffer = function(base64) {
  if (base64) {
    try {
      return new Buffer(base64, 'base64');
    } catch(e) {}
  }
};
var getBuffer = function(item) {
  return toBuffer(item.base64);
};
var getText = function(item) {
  var body = toBuffer(item.base64) || '';
  if (body && !isUtf8(body)) {
    try {
      body = iconv.encode(body, 'GB18030');
    } catch(e) {}
  }
  return body + '';
};

var defineProps = function(obj) {
  if (!obj) {
    return;
  }
  if (Object.defineProperties) {
    Object.defineProperties(obj, {
      body: {
        get: function() {
          return getText(obj);
        }
      },
      buffer: {
        get: function() {
          return getBuffer(obj);
        }
      }
    });
  } else {
    obj.body = getText(obj);
    obj.buffer = getBuffer(obj);
  }
};

var execCallback = function(id, cbs, item) {
  var cb = cbs[id];
  if (cb && (cbs === reqCallbacks || !item || item.endTime)) {
    item = item || '';
    defineProps(item.req);
    defineProps(item.res);
    cb(item);
    delete cbs[id];
  }
};

var retryRequest = function(time) {
  if (!timer) {
    timer = setTimeout(request, time || TIMEOUT);
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
    });
    retryRequest(20);
  };
  var _reqList = reqList.slice(0, MAX_LENGTH);
  var _resList = resList.slice(0, MAX_LENGTH);
  var query = '?reqList=' + JSON.stringify(_reqList) + '&resList=' + JSON.stringify(_resList);

  reqOpts.path = reqOpts.path.replace(QUERY_RE, query);
  var client = http.get(reqOpts, function(res) {
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
  });
  client.on('error', execCb);
  client.setTimeout(6000, function() {
    client.abort();
  });
};

var getSession = function(reqId, cb, isReq) {
  if (!REQ_ID_RE.test(reqId) || typeof cb !== 'function') {
    return;
  }
  if (isReq) {
    reqCallbacks[reqId] = cb;
  } else {
    resCallbacks[reqId] = cb;
  }
  retryRequest(20);
};

var handleStatsResponse = function(req, res) {
  var reqId = req.headers[pluginOpts.REQ_ID_HEADER];
  parseInfo(req);
  req.getReqSession = function(cb) {
    return getSession(reqId, cb, true);
  };
  req.getSession = function(cb) {
    return getSession(reqId, cb);
  };
  res.end();
};
var addSessionApi = function(req) {
  var reqId = req.headers[pluginOpts.REQ_ID_HEADER];
  parseInfo(req);
  req.unsafe_getReqSession = function(cb) {
    return getSession(reqId, cb, true);
  };
  req.unsafe_getSession = function(cb) {
    return getSession(reqId, cb);
  };
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
  pluginOpts = options;
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
      server.on('request', addSessionApi);
      startServer(server, options);
      port = _port;
      callbackHandler();
    });
  }

  var startStatsServer = execPlugin.statsServer || execPlugin.reqStatsServer;
  if (typeof startStatsServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      server.on('request', handleStatsResponse);
      startStatsServer(server, options);
      statsPort = _port;
      callbackHandler();
    });
  }

  var startResStatsServer = execPlugin.resStatsServer;
  if (typeof startResStatsServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      server.on('request', handleStatsResponse);
      startResStatsServer(server, options);
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
      server.on('request', addSessionApi);
      startRulesServer(server, options);
      rulesPort = _port;
      callbackHandler();
    });
  }

  var startResRulesServer = execPlugin.resRulesServer;
  if (typeof startResRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      server.on('request', function(req) {
        var reqId = req.headers[pluginOpts.REQ_ID_HEADER];
        parseInfo(req);
        req.getReqSession = function(cb) {
          return getSession(reqId, cb, true);
        };
        req.unsafe_getSession = function(cb) {
          return getSession(reqId, cb);
        };
      });
      startResRulesServer(server, options);
      resRulesPort = _port;
      callbackHandler();
    });
  }

  var startTunnelRulesServer = execPlugin.pluginRulesServer || execPlugin.tunnelRulesServer;
  if (typeof startTunnelRulesServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      server.on('request', addSessionApi);
      startTunnelRulesServer(server, options);
      tunnelRulesPort = _port;
      callbackHandler();
    });
  }

  var startTunnelServer = execPlugin.pluginServer || execPlugin.tunnelServer || execPlugin.connectServer;
  if (typeof startTunnelServer == 'function') {
    ++count;
    getServer(function(server, _port) {
      server.on('request', addSessionApi);
      startTunnelServer(server, options);
      tunnelPort = _port;
      callbackHandler();
    });
  }

  if (!count) {
    callbackHandler();
  }
};


