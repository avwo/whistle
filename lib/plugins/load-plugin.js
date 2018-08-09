var util = require('util');
var path = require('path');
var url = require('url');
var iconv = require('iconv-lite');
var request = require('./request');
var isUtf8 = require('../util/is-utf8');
var ca = require('../https/ca');
var Storage = require('../rules/storage');
var getServer = require('hagent').create(null, 40500);

var QUERY_RE = /\?.*$/;
var REQ_ID_RE = /^\d{13,15}-\d{1,5}$/;
var sessionOpts, sessionTimer, sessionPending;
var rulesOpts, rulesTimer, rulesPending;
var valuesOpts, valuesTimer, valuesPending;
var reqCallbacks = {};
var resCallbacks = {};
var MAX_LENGTH = 100;
var TIMEOUT = 1000;
var pluginOpts, storage;
var noop = function() {};
/* eslint-disable no-undef */
var SESSION_KEY = typeof Symbol === 'undefined' ? '$symbol_' + Date.now() : Symbol();
/* eslint-enable no-undef */
var ctx;

var getValue = function(req, name) {
  const value = req.headers[name] || '';
  try {
    return value ? decodeURIComponent(value) : '';
  } catch(e) {}
  return String(value);
};
var setContenxt = function(req) {
  if (ctx) {
    ctx.request = req;
    req.ctx = ctx;
  }
  req.localStorage = storage;
  req.Storage = Storage;
  req.clientIp = getValue(req, pluginOpts.CLIENT_IP_HEADER) || '127.0.0.1';
};
var initReq = function(req, res) {
  req.on('error', noop);
  res.on('error', noop);
  var oReq = req.originalReq = {};
  var oRes = req.originalRes = {};
  setContenxt(req);
  oReq.clientIp = req.clientIp;
  oReq.id = getValue(req, pluginOpts.REQ_ID_HEADER);
  oReq.ruleValue = getValue(req, pluginOpts.RULE_VALUE_HEADER);
  oReq.url = oReq.fullUrl = getValue(req, pluginOpts.FULL_URL_HEADER);
  oReq.realUrl = getValue(req, pluginOpts.REAL_URL_HEADER);
  oReq.method = getValue(req, pluginOpts.METHOD_HEADER) || 'GET';
  oReq.clientPort = getValue(req, pluginOpts.CLIENT_PORT_HEAD);
  oReq.globalValue = getValue(req, pluginOpts.GLOBAL_VALUE_HEAD);
  oReq.proxyValue = getValue(req, pluginOpts.PROXY_VALUE_HEADER);
  oReq.pacValue = getValue(req, pluginOpts.PAC_VALUE_HEADER);
  oRes.serverIp = getValue(req, pluginOpts.HOST_IP_HEADER);
  oRes.statusCode = getValue(req, pluginOpts.STATUS_CODE_HEADER);
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
  var cbList = cbs[id];
  if (cbList && (cbs === reqCallbacks || !item || item.endTime)) {
    item = item || '';
    defineProps(item.req);
    defineProps(item.res);
    delete cbs[id];
    cbList.forEach(function(cb) {
      try {
        cb(item);
      } catch(e) {}
    });
  }
};

var retryRequestRules = function(time) {
  if (!rulesTimer) {
    rulesTimer = setTimeout(requestRules, time || TIMEOUT);
  }
};
var requestRules = function() { 
  clearTimeout(rulesTimer);
  rulesTimer = null;
  if (rulesPending) {
    return;
  }
  rulesPending = true;
  request(rulesOpts, function(err, result) {
    rulesPending = false;
    if (err || !result) {
      return retryRequestRules();
    }
    retryRequestRules(20);
  });
};

var retryRequestValues = function(time) {
  if (!valuesTimer) {
    valuesTimer = setTimeout(requestValues, time || TIMEOUT);
  }
};
var requestValues = function() {
  clearTimeout(valuesTimer);
  valuesTimer = null;
  if (valuesPending) {
    return;
  }
  rulesPending = true;
  request(valuesOpts, function(err, result) {
    valuesPending = false;
    if (err || !result) {
      return retryRequestValues();
    }
    retryRequestValues(20);
  });
};

var retryRequestSession = function(time) {
  if (!sessionTimer) {
    sessionTimer = setTimeout(requestSessions, time || TIMEOUT);
  }
};

var requestSessions = function() {
  clearTimeout(sessionTimer);
  sessionTimer = null;
  if (sessionPending) {
    return;
  }
  var reqList = Object.keys(reqCallbacks);
  var resList = Object.keys(resCallbacks);
  if (!reqList.length && !resList.length) {
    return;
  }
  sessionPending = true;
  var _reqList = reqList.slice(0, MAX_LENGTH);
  var _resList = resList.slice(0, MAX_LENGTH);
  var query = '?reqList=' + JSON.stringify(_reqList) + '&resList=' + JSON.stringify(_resList);
  sessionOpts.path = sessionOpts.path.replace(QUERY_RE, query);
  request(sessionOpts, function(err, result) {
    sessionPending = false;
    if (err || !result) {
      return retryRequestSession();
    }
    Object.keys(result).forEach(function(id) {
      var item = result[id];
      execCallback(id, reqCallbacks, item);
      execCallback(id, resCallbacks, item);
    });
    retryRequestSession(20);
  });
};

var getSession = function(reqId, req, cb, isReq) {
  if (!REQ_ID_RE.test(reqId) || typeof cb !== 'function') {
    return;
  }
  var session = req[SESSION_KEY];
  if (session != null) {
    if (isReq) {
      return cb(session);
    }
    if (!session || session.endTime) {
      return cb(session);
    }
  }
  var cbList = isReq ? reqCallbacks[reqId] : resCallbacks[reqId];
  if (cbList) {
    if (cbList.indexOf(cb) === -1) {
      cbList.push(cb);
    }
  } else {
    cbList = [function(s) {
      req[SESSION_KEY] = s;
      cb(s);
    }];
  }
  if (isReq) {
    reqCallbacks[reqId] = cbList;
  } else {
    resCallbacks[reqId] = cbList;
  }
  retryRequestSession(20);
};

var handleStatsResponse = function(req, res) {
  var reqId = req.headers[pluginOpts.REQ_ID_HEADER];
  initReq(req, res);
  req.getReqSession = function(cb) {
    return getSession(reqId, req, cb, true);
  };
  req.getSession = function(cb) {
    return getSession(reqId, req, cb);
  };
  res.end();
};
var addSessionApi = function(req, res) {
  var reqId = req.headers[pluginOpts.REQ_ID_HEADER];
  initReq(req, res);
  req.unsafe_getReqSession = function(cb) {
    return getSession(reqId, req, cb, true);
  };
  req.unsafe_getSession = function(cb) {
    return getSession(reqId, req, cb);
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
  storage = new Storage(path.join(options.config.baseDir, '.plugins', options.name));
  options.storage = options.localStorage = storage;
  var config = options.config;
  var name = options.name;
  pluginOpts = options;
  var headers = {
    'x-whistle-auth-key': config.authKey,
    'x-whistle-plugin-name': name.substring(name.lastIndexOf('.') + 1),
    'content-type': 'application/json'
  };
  var baseUrl = 'http://127.0.0.1:' + config.uiport + '/cgi-bin/';
  sessionOpts = url.parse(baseUrl + 'get-session?');
  sessionOpts.headers = headers;
  rulesOpts = url.parse(baseUrl + 'rules/handler');
  rulesOpts.method = 'POST';
  rulesOpts.headers = headers;
  valuesOpts = url.parse(baseUrl + 'values/handler');
  valuesOpts.method = 'POST';
  valuesOpts.headers = headers;
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
  options.rulesApi = {
    enable: function() {
      
    },
    disable: function() {

    },
    add: function() {

    },
    remove: function() {

    },
    get: function() {

    }
  };
  options.vlauesApi = {
    add: function() {

    },
    remove: function() {

    },
    get: function() {
      
    }
  };
  var initServers = function(_ctx) {
    ctx = _ctx || ctx;
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
        server.on('request', setContenxt);
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
        server.on('request', function(req, res) {
          var reqId = req.headers[pluginOpts.REQ_ID_HEADER];
          initReq(req, res);
          req.getReqSession = function(cb) {
            return getSession(reqId, req, cb, true);
          };
          req.unsafe_getSession = function(cb) {
            return getSession(reqId, req, cb);
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
  var initial = loadModule(path.join(options.value, 'initial.js'));
  if (typeof initial === 'function') {
    if (initial.length === 2) {
      ctx = initial(options, initServers);
      return ctx;
    }
    ctx = initial(options);
  }
  initServers();
};


