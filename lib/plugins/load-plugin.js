var listenerCount = require('../util/patch').listenerCount;
var path = require('path');
var fs = require('fs');
var express = require('express');
var os = require('os');
var format = require('util').format;
var LRU = require('lru-cache');
var iconv = require('iconv-lite');
var wsParser = require('ws-parser');
var http = require('http');
var https = require('https');
var extend = require('extend');
var request = require('../util/http-mgr').request;
var isUtf8 = require('../util/is-utf8');
var Storage = require('../rules/storage');
var getServer = require('hagent').create(null, 40500);
var Buffer = require('safe-buffer').Buffer;
var parseUrl = require('../util/parse-url');
var hparser = require('hparser');
var transproto = require('../util/transproto');
var common = require('../util/common');
var getProxy = require('./proxy');
var rootRequire = require('../../require');

var getEncodeTransform = transproto.getEncodeTransform;
var getDecodeTransform = transproto.getDecodeTransform;

var LEVELS = ['log', 'error', 'warn', 'info', 'debug', 'trace'];
var URL_RE = /^https?:\/\/[^\s]+$/;
var HTTPS_RE = /^(?:https|wss):\/\//;
var MAX_BODY_SIZE = 1024 * 256;
var PING_INTERVAL = 22000;
var sessionStorage = new LRU({
  maxAge: 1000 * 60 * 12,
  max: 1600
});
var createServer = http.createServer;
var httpRequest = http.request;
var httpsRequest = https.request;
var formatHeaders = hparser.formatHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var getRawHeaders = hparser.getRawHeaders;
var STATUS_CODES = http.STATUS_CODES || {};
var pluginName;

var TUNNEL_HOST_RE = /^[^:\/]+\.[^:\/]+:\d+$/;
var QUERY_RE = /\?.*$/;
var REQ_ID_RE = /^\d{13,15}-\d{1,5}$/;
var sessionOpts, sessionTimer, sessionPending;
var framesOpts, framesTimer, framesPending;
var customParserOpts, customParserTimer, customParserPending;
var reqCallbacks = {};
var resCallbacks = {};
var parserCallbacks = {};
var framesList = [];
var framesCallbacks = [];
var MAX_LENGTH = 100;
var MAX_BUF_LEN = 1024 * 1024;
var TIMEOUT = 300;
var REQ_INTERVAL = 16;
var pluginOpts, storage;
var pluginKeyMap = {};
var MASK_OPTIONS = { mask: true };
var BINARY_MASK_OPTIONS = { mask: true, binary: true };
var BINARY_OPTIONS = { binary: true };
/* eslint-disable no-undef */
var REQ_ID_KEY =
  typeof Symbol === 'undefined' ? '$reqId_' + Date.now() : Symbol();
var SESSION_KEY =
  typeof Symbol === 'undefined' ? '$session_' + Date.now() : Symbol();
var FRAME_KEY =
  typeof Symbol === 'undefined' ? '$frame_' + Date.now() : Symbol();
var REQ_KEY = typeof Symbol === 'undefined' ? '$req_' + Date.now() : Symbol();
var CLOSED = typeof Symbol === 'undefined' ? '$colsed_' + Date.now() : Symbol();
var NOT_NAME_RE = /[^\w.-]/;
/* eslint-enable no-undef */
var index = 1000;
var pluginVersion = '';
var noop = common.noop;
var certsCache = new LRU({ max: 256 });
var certsCallbacks = {};
var ctx;
var PLUGIN_HOOK_NAME_HEADER;
var UPGRADE_HEADER;
var GLOBAL_PLUGIN_VARS_HEAD;
var PLUGIN_VARS_HEAD;
var FROM_TUNNEL_HEADER;
var REMOTE_ADDR_HEAD;
var REMOTE_PORT_HEAD;
var SNI_TYPE_HEADER;
var PROXY_ID_HEADER;
var REQ_FROM_HEADER;
var debugMode;
var pluginInited;
var writeDevLog;

process._handlePforkUncaughtException = function (msg, e) {
  msg = [
    'From: ' + pluginName + pluginVersion,
    'Node: ' + process.version,
    'Host: ' + os.hostname(),
    'Date: ' + new Date().toLocaleString(),
    msg
  ].join('\n');
  pluginInited && debugMode && console.error(msg); // eslint-disable-line
  common.writeLogSync('\r\n' + msg + '\r\n');
  writeDevLog && writeDevLog('\n' + msg);
  if (typeof process.handleUncaughtPluginErrorMessage === 'function') {
    return process.handleUncaughtPluginErrorMessage(msg, e);
  }
};

var appendTrailers = function (_res, res, newTrailers, req) {
  if (res.disableTrailer || res.disableTrailers) {
    return;
  }
  common.addTrailerNames(_res, newTrailers, null, null, req);
  common.onResEnd(_res, function () {
    var trailers = _res.trailers;
    if (
      !res.chunkedEncoding ||
      (common.isEmptyObject(trailers) && common.isEmptyObject(newTrailers))
    ) {
      return;
    }
    var rawHeaderNames = _res.rawTrailers
      ? getRawHeaderNames(_res.rawTrailers)
      : {};
    if (newTrailers) {
      newTrailers = common.lowerCaseify(newTrailers, rawHeaderNames);
      if (trailers) {
        extend(trailers, newTrailers);
      } else {
        trailers = newTrailers;
      }
    }
    try {
      common.removeIllegalTrailers(trailers);
      res.addTrailers(formatHeaders(trailers, rawHeaderNames));
    } catch (e) {}
  });
};

var requestData = function (options, callback) {
  request(options, function (err, body) {
    if (err) {
      return callback(err);
    }
    try {
      return callback(null, JSON.parse(body));
    } catch (e) {
      return callback(e);
    }
  });
};

var getValue = function (req, name) {
  var value = req.headers[name] || '';
  try {
    return value ? decodeURIComponent(value) : '';
  } catch (e) {}
  return String(value);
};
var setContext = function (req) {
  if (ctx) {
    req.ctx = ctx;
  }
  req.localStorage = storage;
  req.Storage = Storage;
  req.clientIp = getValue(req, pluginOpts.CLIENT_IP_HEADER) || '127.0.0.1';
};

var initState = function (req, name) {
  switch (name) {
  case 'pauseSend':
    req.curSendState = 'pause';
    return;
  case 'ignoreSend':
    req.curSendState = 'ignore';
    return;
  case 'pauseReceive':
    req.curReceiveState = 'pause';
    return;
  case 'ignoreReceive':
    req.curReceiveState = 'ignore';
    return;
  }
};

var getFrameId = function () {
  ++index;
  if (index > 9990) {
    index = 1000;
  }
  if (index > 99) {
    return Date.now() + '-' + index;
  }
  if (index > 9) {
    return Date.now() + '-0' + index;
  }
  return Date.now() + '-00' + index;
};

var addFrame = function (frame) {
  framesList.push(frame);
  if (framesList.length > 720) {
    framesList.splice(0, 80);
  }
};

var getFrameOpts = function (opts) {
  if (!opts) {
    return {};
  }
  if (opts === true) {
    return { ignore: true };
  }
  var result = {};
  if (opts.ignore === true) {
    result.ignore = true;
  }
  if (opts.compressed === true) {
    result.compressed = true;
  }
  if (opts.opcode > 0) {
    result.opcode = opts.opcode == 1 ? 1 : 2;
  }
  if (opts.isError) {
    result.isError = true;
  }
  if (typeof opts.charset === 'string') {
    result.charset = opts.charset;
  }
  return result;
};
var pushFrame = function (reqId, data, opts, isClient) {
  if (data == null) {
    return;
  }
  if (!Buffer.isBuffer(data)) {
    try {
      if (typeof data !== 'string') {
        data = JSON.stringify(data);
      }
      data = Buffer.from(data);
    } catch (e) {
      data = null;
    }
  }
  if (!data) {
    return;
  }
  opts = getFrameOpts(opts);
  opts.reqId = reqId;
  opts.frameId = getFrameId();
  opts.isClient = isClient;
  opts.length = data.length;
  if (opts.length > MAX_BUF_LEN) {
    data = data.slice(0, MAX_BUF_LEN);
  }
  opts.base64 = data.toString('base64');
  addFrame(opts);
};
var addParserApi = function (req, conn, state, reqId) {
  state = state.split(',').forEach(function (name) {
    initState(req, name);
  });
  req.on('clientFrame', function (data, opts) {
    pushFrame(reqId, data, opts, true);
  });
  req.on('serverFrame', function (data, opts) {
    pushFrame(reqId, data, opts);
  });
  var on = req.on;
  req.on = function (eventName) {
    on.apply(this, arguments);
    var curState, prevState;
    if (eventName === 'sendStateChange') {
      curState = req.curSendState;
      prevState = req.prevSendState;
    } else if (eventName === 'receiveStateChange') {
      curState = req.curReceiveState;
      prevState = req.prevReceiveState;
    }
    if (curState || prevState) {
      req.emit(eventName, curState, prevState);
    }
  };
  var disconnected;
  var emitDisconnect = function (err) {
    if (disconnected) {
      return;
    }
    req.isDisconnected = disconnected = true;
    addFrame({
      reqId: reqId,
      frameId: getFrameId(),
      closed: !err,
      err: err && err.message,
      bin: ''
    });
    delete parserCallbacks[reqId];
    req.emit('disconnect', err);
  };
  conn.on('error', emitDisconnect);
  conn.on('close', emitDisconnect);
  parserCallbacks[reqId] = function (data) {
    if (!data) {
      return conn.destroy();
    }
    var sendState, receiveState;
    if (data.sendStatus === 1) {
      sendState = 'pause';
    } else if (data.sendStatus === 2) {
      sendState = 'ignore';
    }
    if (data.receiveStatus === 1) {
      receiveState = 'pause';
    } else if (data.receiveStatus === 2) {
      receiveState = 'ignore';
    }
    var curSendState = req.curSendState;
    if (curSendState != sendState) {
      req.prevSendState = req.curSendState;
      req.curSendState = sendState;
      try {
        req.emit('sendStateChange', req.curSendState, req.prevSendState);
      } catch (e) {}
    }
    var curReceiveState = req.curReceiveState;
    if (curReceiveState != receiveState) {
      req.prevReceiveState = req.curReceiveState;
      req.curReceiveState = receiveState;
      try {
        req.emit(
          'receiveStateChange',
          req.curReceiveState,
          req.prevReceiveState
        );
      } catch (e) {}
    }
    if (Array.isArray(data.toClient)) {
      data.toClient.forEach(function (frame) {
        var buf = toBuffer(frame.base64);
        try {
          buf && req.emit('sendToClient', buf, frame.binary);
        } catch (e) {}
      });
    }
    if (Array.isArray(data.toServer)) {
      data.toServer.forEach(function (frame) {
        var buf = toBuffer(frame.base64);
        try {
          buf && req.emit('sendToServer', buf, frame.binary);
        } catch (e) {}
      });
    }
  };
  retryCustomParser();
};

var addSessionStorage = function (req, id) {
  req.sessionStorage = {
    set: function (key, value) {
      var cache = sessionStorage.get(id);
      if (!cache) {
        cache = {};
        sessionStorage.set(id, cache);
      }
      cache[key] = value;
      return value;
    },
    get: function (key) {
      var cache = sessionStorage.get(id);
      return cache && cache[key];
    },
    remove: function (key) {
      var cache = sessionStorage.peek(id);
      if (cache) {
        delete cache[key];
      }
    }
  };
};

var ADDITIONAL_FIELDS = [
  'headers',
  'rawHeaders',
  'trailers',
  'rawTrailers',
  'url',
  'method',
  'statusCode',
  'statusMessage',
  'sendEstablished',
  'unsafe_getReqSession',
  'unsafe_getSession',
  'unsafe_getFrames',
  'getReqSession',
  'getSession',
  'getFrames',
  'request',
  'originalReq',
  'response',
  'originalRes',
  'localStorage',
  'Storage',
  'clientIp',
  'sessionStorage'
];

function getPluginVars(req, key) {
  var value = req.headers[key];
  value = toBuffer(value);
  if (value) {
    delete req.headers[key];
    try {
      value = JSON.parse(value.toString());
      if (Array.isArray(value)) {
        return value;
      }
    } catch (e) {}
  }
  return [];
}

var initReq = function (req, res, isServer) {
  if (req.originalReq && req.originalRes) {
    return;
  }
  var destroy = function () {
    if (!req._hasError) {
      req._hasError = true;
      req.destroy && req.destroy();
      res.destroy && res.destroy();
    }
  };
  req.on('error', destroy);
  res.on('error', destroy);
  req.getReqSession = req.unsafe_getReqSession = function (cb) {
    return getSession(req, cb, true);
  };
  req.getSession = req.unsafe_getSession = function (cb) {
    return getSession(req, cb);
  };
  req.getFrames = req.unsafe_getFrames = function (cb) {
    return getFrames(req, cb);
  };

  var reqId = getValue(req, pluginOpts.REQ_ID_HEADER);
  var oReq = (req.originalReq = {});
  var oRes = (req.originalRes = {});
  setContext(req);
  oReq.clientIp = req.clientIp;
  if (isServer) {
    var parseStatus = req.headers[pluginOpts.CUSTOM_PARSER_HEADER];
    req.customParser = oReq.customParser = notEmptyStr(parseStatus);
    req.customParser && addParserApi(req, res, parseStatus, reqId);
  }
  var conf = pluginOpts.config;
  req[REQ_ID_KEY] = oReq.id = reqId;
  addSessionStorage(req, reqId);
  oReq.isHttp2 = oReq.isH2 = !!req.headers[conf.ALPN_PROTOCOL_HEADER];
  oReq.existsCustomCert = req.headers[pluginOpts.CUSTOM_CERT_HEADER] == '1';
  oReq.isUIRequest = req.isUIRequest =
    req.headers[pluginOpts.UI_REQUEST_HEADER] == '1';
  oReq.enableCapture = req.headers[pluginOpts.ENABLE_CAPTURE_HEADER] == '1';
  oReq.isFromPlugin = req.headers[pluginOpts.PLUGIN_REQUEST_HEADER] == '1';
  oReq.ruleValue = getValue(req, pluginOpts.RULE_VALUE_HEADER);
  oReq.ruleUrl = getValue(req, pluginOpts.RULE_URL_HEADER) || oReq.ruleValue;
  oReq.pipeValue = getValue(req, pluginOpts.PIPE_VALUE_HEADER);
  oReq.sniValue = getValue(req, pluginOpts.SNI_VALUE_HEADER);
  oReq.hostValue = getValue(req, pluginOpts.HOST_VALUE_HEADER);
  oReq.extraUrl = getValue(req, pluginOpts.EXTRA_URL_HEADER);
  var fullUrl = getValue(req, pluginOpts.FULL_URL_HEADER);
  var pattern = getValue(req, 'x-whistle-raw-pattern_');
  oReq.url = oReq.fullUrl = req.fullUrl = fullUrl;
  req.isHttps = oReq.isHttps = HTTPS_RE.test(fullUrl);
  oReq.remoteAddress = req.headers[REMOTE_ADDR_HEAD] || '127.0.0.1';
  oReq.remotePort = parseInt(req.headers[REMOTE_PORT_HEAD], 10) || 0;
  req.fromTunnel = oReq.fromTunnel = req.headers[FROM_TUNNEL_HEADER] === '1';
  delete req.headers[FROM_TUNNEL_HEADER];
  delete req.headers[REMOTE_ADDR_HEAD];
  delete req.headers[REMOTE_PORT_HEAD];
  if (pattern) {
    delete req.headers['x-whistle-raw-pattern_'];
    if (pattern[1] === ',') {
      oReq.isRexExp = oReq.isRegExp = pattern[0] === '1';
      oReq.pattern = pattern.substring(2);
    }
  }
  req.fromComposer = oReq.fromComposer =
    req.headers[REQ_FROM_HEADER] === 'W2COMPOSER';
  oReq.servername = oReq.serverName = getValue(
    req,
    pluginOpts.SERVER_NAME_HEAD
  );
  var certCacheInfo = getValue(req, pluginOpts.CERT_CACHE_INFO);
  oReq.certCacheName = certCacheInfo;
  oReq.certCacheTime = 0;
  if (certCacheInfo) {
    var sepIndex = certCacheInfo.indexOf('+');
    if (sepIndex !== -1) {
      oReq.certCacheName = certCacheInfo.substring(0, sepIndex);
      oReq.certCacheTime = parseInt(certCacheInfo.substring(sepIndex + 1)) || 0;
    }
  }
  var sniType = req.headers[SNI_TYPE_HEADER];
  var isSNI;
  if (sniType) {
    delete req.headers[SNI_TYPE_HEADER];
    if (sniType === '1') {
      isSNI = true;
      req.isHttpsServer = true;
    }
  } else {
    isSNI = true;
  }
  req.useSNI = oReq.useSNI = req.isSNI = oReq.isSNI = isSNI;
  oReq.commonName = getValue(req, pluginOpts.COMMON_NAME_HEAD);
  oReq.realUrl = getValue(req, pluginOpts.REAL_URL_HEADER) || oReq.url;
  oReq.relativeUrl = getValue(req, pluginOpts.RELATIVE_URL_HEADER);
  oReq.method = getValue(req, pluginOpts.METHOD_HEADER) || 'GET';
  oReq.clientPort = getValue(req, pluginOpts.CLIENT_PORT_HEAD);
  oReq.globalValue = getValue(req, pluginOpts.GLOBAL_VALUE_HEAD);
  oReq.proxyValue = getValue(req, pluginOpts.PROXY_VALUE_HEADER);
  oReq.pacValue = getValue(req, pluginOpts.PAC_VALUE_HEADER);
  oReq.pluginVars = getPluginVars(req, PLUGIN_VARS_HEAD);
  oReq.globalPluginVars = getPluginVars(req, GLOBAL_PLUGIN_VARS_HEAD);
  oRes.serverIp = getValue(req, pluginOpts.HOST_IP_HEADER) || '';
  oRes.statusCode = getValue(req, pluginOpts.STATUS_CODE_HEADER);
  oReq.headers = extractHeaders(req, pluginKeyMap);
};
var getOptions = function (opts, binary, toServer) {
  if (opts) {
    opts.mask = toServer;
    opts.binary = opts.binary || opts.opcode == 2;
    return opts;
  }
  if (toServer) {
    return binary ? BINARY_MASK_OPTIONS : MASK_OPTIONS;
  }
  return binary ? BINARY_OPTIONS : '';
};
var toBuffer = function (base64) {
  if (base64) {
    try {
      return new Buffer(base64, 'base64');
    } catch (e) {}
  }
};
var getBuffer = function (item) {
  return toBuffer(item.base64);
};
var getText = function (item) {
  var body = toBuffer(item.base64) || '';
  if (body && !isUtf8(body)) {
    try {
      body = iconv.encode(body, 'GB18030');
    } catch (e) {}
  }
  return body + '';
};

var defineProps = function (obj) {
  if (!obj) {
    return;
  }
  if (Object.defineProperties) {
    Object.defineProperties(obj, {
      body: {
        get: function () {
          return getText(obj);
        }
      },
      buffer: {
        get: function () {
          return getBuffer(obj);
        }
      }
    });
  } else {
    obj.body = getText(obj);
    obj.buffer = getBuffer(obj);
  }
};

var execCallback = function (id, cbs, item) {
  var cbList = cbs[id];
  if (cbList && (cbs === reqCallbacks || !item || item.endTime)) {
    item = item || '';
    defineProps(item.req);
    defineProps(item.res);
    delete cbs[id];
    cbList.forEach(function (cb) {
      try {
        cb(item);
      } catch (e) {}
    });
  }
};

var retryRequestSession = function (time) {
  if (!sessionTimer) {
    sessionTimer = setTimeout(requestSessions, time || TIMEOUT);
  }
};

var requestSessions = function () {
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
  var query =
    '?reqList=' +
    JSON.stringify(_reqList) +
    '&resList=' +
    JSON.stringify(_resList);
  sessionOpts.path = sessionOpts.path.replace(QUERY_RE, query);
  requestData(sessionOpts, function (err, result) {
    sessionPending = false;
    if (err || !result) {
      return retryRequestSession();
    }
    Object.keys(result).forEach(function (id) {
      var item = result[id];
      execCallback(id, reqCallbacks, item);
      execCallback(id, resCallbacks, item);
    });
    retryRequestSession(REQ_INTERVAL);
  });
};

var retryRequestFrames = function (time) {
  if (!framesTimer) {
    framesTimer = setTimeout(requestFrames, time || TIMEOUT);
  }
};
var requestFrames = function () {
  clearTimeout(framesTimer);
  framesTimer = null;
  if (framesPending) {
    return;
  }
  var cb = framesCallbacks.shift();
  if (!cb) {
    return;
  }
  var req = cb[REQ_KEY];
  if (req[CLOSED]) {
    return cb('');
  }
  framesPending = true;
  var query =
    '?curReqId=' + req[REQ_ID_KEY] + '&lastFrameId=' + (req[FRAME_KEY] || '');
  framesOpts.path = framesOpts.path.replace(QUERY_RE, query);
  requestData(framesOpts, function (err, result) {
    framesPending = false;
    if (err || !result) {
      framesCallbacks.push(cb);
      return retryRequestFrames();
    }
    var frames = result.frames;
    var closed;
    if (Array.isArray(frames)) {
      var last = frames[frames.length - 1];
      var frameId = last && last.frameId;
      if (frameId) {
        req[FRAME_KEY] = frameId;
        frames.forEach(defineProps);
        closed = !!(last.closed || last.err);
      }
    } else {
      closed = !frames;
    }
    if (closed || frames.length) {
      req[CLOSED] = closed;
      try {
        cb(frames || '');
      } catch (e) {}
    } else {
      framesCallbacks.push(cb);
    }
    retryRequestFrames(REQ_INTERVAL);
  });
};

var retryCustomParser = function (time) {
  if (!customParserTimer) {
    customParserTimer = setTimeout(customParser, time || TIMEOUT);
  }
};

var customParser = function () {
  clearTimeout(customParserTimer);
  customParserTimer = null;
  if (customParserPending) {
    return;
  }
  var idList = Object.keys(parserCallbacks);
  if (!idList.length && !framesList.length) {
    return;
  }
  customParserPending = true;
  customParserOpts.body = {
    idList: idList,
    frames: framesList.splice(0, 10)
  };
  requestData(customParserOpts, function (err, result) {
    customParserPending = false;
    customParserOpts.body = undefined;
    if (err || !result) {
      return retryCustomParser();
    }
    idList.forEach(function (reqId) {
      var cb = parserCallbacks[reqId];
      cb && cb(result[reqId]);
    });
    retryCustomParser(framesList.length > 0 ? 20 : 300);
  });
};

function isFrames(item) {
  if (/^wss?:\/\//.test(item.url)) {
    return item.res.statusCode == 101;
  }
  return item.inspect || item.useFrames;
}

var getFrames = function (req, cb) {
  var reqId = req[REQ_ID_KEY];
  if (!REQ_ID_RE.test(reqId) || typeof cb !== 'function') {
    return;
  }
  if (req[CLOSED]) {
    return cb('');
  }
  cb[REQ_KEY] = req;
  getSession(req, function (session) {
    if (
      !session ||
      session.reqError ||
      session.resError ||
      !isFrames(session)
    ) {
      req[CLOSED] = 1;
      return cb('');
    }
    framesCallbacks.push(cb);
    requestFrames();
  });
};

var getSession = function (req, cb, isReq) {
  var reqId = req[REQ_ID_KEY];
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
    cbList = [
      function (s) {
        req[SESSION_KEY] = s;
        cb(s);
      }
    ];
  }
  if (isReq) {
    reqCallbacks[reqId] = cbList;
  } else {
    resCallbacks[reqId] = cbList;
  }
  retryRequestSession();
};

var initWsReq = function (req, res) {
  initReq(req, res, true);
};
var initConnectReq = function (req, res) {
  if (req.originalReq && req.originalRes) {
    return;
  }
  var established;
  initWsReq(req, res);
  req.sendEstablished = function (err, cb) {
    if (established) {
      return;
    }
    if (typeof err === 'function') {
      cb = err;
      err = null;
    }
    req.isEstablished = true;
    established = true;
    var msg = err ? 'Bad Gateway' : 'Connection Established';
    var body = String((err && err.stack) || '');
    var length = Buffer.byteLength(body);
    var resCtn = [
      'HTTP/1.1 ' + (err ? 502 : 200) + ' ' + msg,
      'Content-Length: ' + length,
      'Proxy-Agent: ' + pluginOpts.shortName
    ];
    if (err || !cb || !req.headers['x-whistle-request-tunnel-ack']) {
      resCtn.push('\r\n', body);
      res.write(resCtn.join('\r\n'));
      return cb && cb();
    }
    resCtn.push('x-whistle-allow-tunnel-ack: 1');
    resCtn.push('\r\n', body);
    res.once('data', function (chunk) {
      if (!req._hasError) {
        res.pause();
        var on = res.on;
        res.on = function () {
          res.on = on;
          res.resume();
          return on.apply(this, arguments);
        };
        chunk.length > 1 && res.unshift(chunk.slice(1));
        cb();
      }
    });
    return res.write(resCtn.join('\r\n'));
  };
};

var loadModule = function (filepath) {
  try {
    return require(filepath);
  } catch (e) {}
};

function getFunction(fn) {
  return typeof fn === 'function' ? fn : null;
}

function notEmptyStr(str) {
  return str && typeof str === 'string';
}

function getHookName(req) {
  var name = req.headers[PLUGIN_HOOK_NAME_HEADER];
  delete req.headers[PLUGIN_HOOK_NAME_HEADER];
  return typeof name === 'string' ? name : null;
}

function isUpgrade(req) {
  if (req.headers[UPGRADE_HEADER]) {
    delete req.headers[UPGRADE_HEADER];
    return true;
  }
}

function handleError(socket, sender, receiver) {
  var emitError = function (err) {
    if (socket._emittedError) {
      return;
    }
    socket._emittedError = true;
    socket.emit('error', err);
  };
  sender && sender.on('error', emitError);
  receiver && (receiver.onerror = emitError);
}

function toBinary(data) {
  if (!data || Buffer.isBuffer(data)) {
    return data && data.length && data;
  }
  if (typeof data !== 'string') {
    try {
      data = JSON.stringify(data);
    } catch (e) {
      return;
    }
  }
  return Buffer.from(data);
}

function wrapTunnelWriter(socket, toServer) {
  var write = socket.write;
  var end = socket.end;
  var sender = wsParser.getSender(socket, toServer);
  handleError(socket, sender);
  socket.write = function (chunk, encoding, cb) {
    if ((chunk = toBinary(chunk))) {
      if (encoding === 'binary') {
        return write.call(this, chunk, encoding, cb);
      }
      if (toServer) {
        sender.send(chunk, extend({ mask: true }, encoding));
      } else {
        sender.send(chunk);
      }
    }
  };
  if (toServer) {
    socket.write = function (chunk, opts, cb) {
      if ((chunk = toBinary(chunk))) {
        if (opts === 'binary') {
          return write.call(this, chunk, opts, cb);
        }
        sender.send(chunk, getOptions(opts, false, true));
      }
    };
    socket.writeText = function (chunk) {
      if ((chunk = toBinary(chunk))) {
        sender.send(chunk, getOptions(null, false, true));
      }
    };
    socket.writeBin = function (chunk) {
      if ((chunk = toBinary(chunk))) {
        sender.send(chunk, getOptions(null, true, true));
      }
    };
    socket.closeWebSocket = function (code, data, cb) {
      sender.close(code || 1000, data, true, cb);
    };
    socket.ping = function (data) {
      return sender.ping(data, { mask: true });
    };
  } else {
    socket.write = function (chunk, encoding, cb) {
      if ((chunk = toBinary(chunk))) {
        if (encoding === 'binary') {
          return write.call(this, chunk, encoding, cb);
        }
        sender.send(chunk);
      }
    };
  }
  socket.end = function (chunk, encoding, cb) {
    chunk && socket.write(chunk, encoding, cb);
    return end.call(this);
  };
  return socket;
}

function wrapTunnelReader(socket, fromServer, maxPayload) {
  socket.wsExts = '';
  var receiver = wsParser.getReceiver(socket, fromServer, maxPayload);
  var emit = socket.emit;
  handleError(socket, null, receiver);
  socket.emit = function (type, chunk) {
    if (type === 'data' && chunk) {
      return receiver.add(chunk);
    }
    return emit.apply(this, arguments);
  };
  receiver.onData = function (chunk, opts) {
    emit.call(socket, 'data', chunk, opts);
  };
  receiver.onpong = function (data, opts) {
    socket.emit('pong', data, opts);
  };
  return socket;
}

function setReqRules(uri, reqRules) {
  if (!reqRules) {
    return;
  }
  var rules = reqRules.rules || reqRules;
  var values = reqRules.values;
  if (typeof rules !== 'string') {
    return;
  }
  uri.headers = uri.headers || {};
  uri.headers['x-whistle-rule-value'] = encodeURIComponent(rules);
  if (!values) {
    return;
  }
  if (typeof values !== 'string') {
    try {
      values = JSON.stringify(values);
    } catch (e) {
      return;
    }
  }
  uri.headers['x-whistle-key-value'] = encodeURIComponent(values);
}

function addFrameHandler(req, socket, maxWsPayload, fromClient, toServer) {
  socket.wsExts = req.headers['sec-websocket-extensions'] || '';
  var receiver = wsParser.getReceiver(socket, !fromClient, maxWsPayload);
  var emit = socket.emit;
  var write = socket.write;
  var end = socket.end;
  var lastOpts;
  var sender = wsParser.getSender(socket, toServer);

  handleError(socket, sender, receiver);
  socket.emit = function (type, chunk) {
    if (type === 'data' && chunk) {
      return receiver.add(chunk);
    }
    return emit.apply(this, arguments);
  };
  receiver.onData = function (chunk, opts) {
    if (opts && opts.opcode == 2) {
      opts.binary = true;
    }
    lastOpts = opts;
    emit.call(socket, 'data', chunk, opts);
  };
  socket.write = function (chunk, opts, cb) {
    if ((chunk = toBinary(chunk))) {
      if (opts === 'binary') {
        return write.call(this, chunk, opts, cb);
      }
      sender.send(chunk, getOptions(opts || lastOpts, false, toServer));
    }
  };
  socket.writeText = function (chunk) {
    if ((chunk = toBinary(chunk))) {
      sender.send(chunk, getOptions(null, false, toServer));
    }
  };
  socket.writeBin = function (chunk) {
    if ((chunk = toBinary(chunk))) {
      sender.send(chunk, getOptions(null, true, toServer));
    }
  };
  socket.end = function (chunk, opts, cb) {
    chunk && socket.write(chunk, opts, cb);
    return end.call(this);
  };
  if (fromClient === toServer) {
    return handleWsSignal(receiver, sender);
  }
  return {
    receiver: receiver,
    sender: sender
  };
}

function formatRawHeaders(headers, req) {
  var rawHeaders = headers && (req.rawHeaders || req);
  if (!Array.isArray(rawHeaders)) {
    return headers;
  }
  var rawNames = getRawHeaderNames(rawHeaders);
  if (headers.trailer && !rawNames.trailer) {
    rawNames.trailer = 'Trailer';
  }
  return formatHeaders(headers, rawNames);
}

function extractHeaders(req, exlucdekyes) {
  var headers = {};
  Object.keys(req.headers).forEach(function (key) {
    if (!exlucdekyes[key]) {
      headers[key] = req.headers[key];
    }
  });
  return headers;
}

function addErrorHandler(req, client) {
  var done;
  client.on('error', function (err) {
    if (!done) {
      done = true;
      req.destroy && req.destroy(err);
      client.abort && client.abort();
    }
  });
}

function handleWsSignal(receiver, sender) {
  receiver.onping = sender.ping.bind(sender);
  receiver.onpong = sender.pong.bind(sender);
  receiver.onclose = function (code, message, opts) {
    sender.close(code, message, opts.masked);
  };
}

function destroySocket() {
  this.destroy();
}

module.exports = async function (options, callback) {
  var root = options.value;
  if (options.isDev) {
    var devLogFile = path.join(root, '.console.log');
    var devLogOptions = { flag: 'a+' };
    writeDevLog = function(log) {
      fs.writeFile(devLogFile, log, devLogOptions, common.noop);
    };
    LEVELS.forEach((level) => {
      const originalFn = console[level]; // eslint-disable-line
      if (originalFn) {
        console[level] = function() { // eslint-disable-line
          try {
            writeDevLog(format.apply(null, arguments) + '\n');
          } catch (e) {}
          return originalFn.apply(this, arguments);
        };
      }
    });
  }
  options.Storage = Storage;
  options.parseUrl = parseUrl;
  options.formatHeaders = formatRawHeaders;
  options.wsParser = wsParser;
  options.RULE_PROTO_HEADER = 'x-whistle-rule-proto';
  pluginVersion = '@' + options.version;
  var wrapWsReader = function (socket, maxPayload) {
    wrapTunnelReader(socket, true, maxPayload);
    return socket;
  };
  var wrapWsWriter = function (socket) {
    wrapTunnelWriter(socket, true);
    var timer = setInterval(function () {
      socket.ping();
    }, PING_INTERVAL);
    var handleClose = function () {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    socket.once('error', handleClose);
    socket.once('close', handleClose);
    socket.stopPing = function () {
      timer && clearInterval(timer);
    };
    socket.startPing = function () {
      if (timer) {
        socket.ping();
        timer = setInterval(function () {
          socket.ping();
        }, PING_INTERVAL);
      }
    };
    return socket;
  };
  options.wrapWsReader = wrapWsReader;
  options.wrapWsWriter = wrapWsWriter;
  options.require = rootRequire;
  debugMode = options.debugMode;
  pluginName = options.name;
  var config = options.config;
  var boundIp = config.host;
  var boundPort = config.port;
  var PLUGIN_HOOKS = config.PLUGIN_HOOKS;
  var RES_RULES_HEAD = config.RES_RULES_HEAD;
  var getRulesStr = function (obj) {
    obj = JSON.stringify({
      rules: typeof obj === 'string' ? obj : obj.rules,
      values: obj.values,
      root: root
    });
    return encodeURIComponent(obj);
  };
  var SHOW_LOGIN_BOX = options.SHOW_LOGIN_BOX;
  FROM_TUNNEL_HEADER = options.FROM_TUNNEL_HEADER;
  SNI_TYPE_HEADER = config.SNI_TYPE_HEADER;
  REMOTE_ADDR_HEAD = config.REMOTE_ADDR_HEAD;
  REMOTE_PORT_HEAD = config.REMOTE_PORT_HEAD;
  PROXY_ID_HEADER = config.PROXY_ID_HEADER;
  REQ_FROM_HEADER = config.REQ_FROM_HEADER;
  options.REQ_FROM_HEADER = REQ_FROM_HEADER; // 兼容老逻辑

  GLOBAL_PLUGIN_VARS_HEAD = options.GLOBAL_PLUGIN_VARS_HEAD;
  PLUGIN_VARS_HEAD = options.PLUGIN_VARS_HEAD;
  UPGRADE_HEADER = config.UPGRADE_HEADER;
  delete config.UPGRADE_HEADER;
  delete config.PLUGIN_HOOKS;
  delete config.PROXY_ID_HEADER;
  delete config.REMOTE_ADDR_HEAD;
  delete config.REMOTE_PORT_HEAD;
  delete config.RES_RULES_HEAD;
  delete config.SNI_TYPE_HEADER;
  delete options.GLOBAL_PLUGIN_VARS_HEAD;
  delete options.PLUGIN_VARS_HEAD;
  delete options.FROM_TUNNEL_HEADER;
  delete options.SHOW_LOGIN_BOX;

  PLUGIN_HOOK_NAME_HEADER = config.PLUGIN_HOOK_NAME_HEADER;
  options.shortName = pluginName.substring(pluginName.indexOf('/') + 1);
  var pluginDataDir = (config.pluginBaseDir = path.join(
    config.baseDir,
    '.plugins',
    options.name
  ));
  if (config.storage) {
    pluginDataDir += encodeURIComponent('/' + config.storage);
  }
  config.pluginDataDir = pluginDataDir;
  storage = new Storage(pluginDataDir);
  options.storage = options.localStorage = storage;
  pluginOpts = options;
  Object.keys(options).forEach(function (key) {
    key = options[key];
    if (typeof key === 'string' && !key.indexOf('x-whistle-')) {
      pluginKeyMap[key] = 1;
    }
  });
  var authKey = config.authKey;
  delete config.authKey;
  var headers = {
    'x-whistle-auth-key': authKey,
    'content-type': 'application/json'
  };
  var baseUrl = 'http://' + boundIp + ':' + boundPort;
  options.baseUrl = baseUrl;
  baseUrl += '/cgi-bin/';
  sessionOpts = parseUrl(baseUrl + 'get-session?');
  sessionOpts.headers = headers;
  framesOpts = parseUrl(baseUrl + 'get-frames?');
  framesOpts.headers = headers;
  customParserOpts = parseUrl(baseUrl + 'custom-frames?');
  customParserOpts.headers = headers;
  customParserOpts.method = 'POST';
  var normalizeArgs = function (
    uri,
    cb,
    req,
    curUrl,
    isWs,
    opts,
    alpnProtocol
  ) {
    var type = uri && typeof uri;
    var headers, method;
    if (type !== 'string') {
      if (uri && type === 'object') {
        if (uri.headers) {
          headers = extend({}, uri.headers);
        }
        method = typeof uri.method === 'string' ? uri.method : null;
        uri = uri.uri || uri.url || uri.href || curUrl;
      } else {
        if (type === 'function') {
          opts = cb;
          cb = uri;
        } else if (cb && typeof cb !== 'function') {
          opts = cb;
          cb = null;
        }
        uri = curUrl;
      }
    }
    uri = parseUrl(uri);
    headers = headers || extractHeaders(req, pluginKeyMap);
    if (isWs) {
      headers.upgrade = headers.upgrade || 'websocket';
      headers.connection = 'Upgrade';
      uri.method = 'GET';
    } else {
      uri.method = method || req.method;
    }
    var isHttps = uri.protocol === 'https:' || uri.protocol === 'wss:';
    headers.host = uri.host;
    uri.protocol = null;
    if (!uri.rejectUnauthorized) {
      uri.rejectUnauthorized = false;
    }
    if (!opts || !notEmptyStr(opts.host)) {
      headers[PROXY_ID_HEADER] = 1;
      uri.host = boundIp;
      uri.port = boundPort;
      if (req.originalReq) {
        headers[REMOTE_ADDR_HEAD] = req.originalReq.remoteAddress;
        headers[REMOTE_PORT_HEAD] = req.originalReq.remotePort;
      }
      if (isHttps) {
        headers[config.HTTPS_FIELD] = 1;
        if (alpnProtocol) {
          headers[config.ALPN_PROTOCOL_HEADER] = alpnProtocol;
        }
      }
      isHttps = false;
    } else {
      uri.host = opts.host;
      uri.port = opts.port > 0 ? opts.port : isHttps ? 443 : 80;
      if (isHttps) {
        if (opts.internalRequest) {
          isHttps = false;
          headers[config.HTTPS_FIELD] = 1;
        } else {
          uri.protocol = 'https:';
        }
      }
    }
    delete uri.hostname;
    uri.headers = formatRawHeaders(headers, req);
    uri.agent = false;
    return [uri, cb, isHttps, opts];
  };

  var authPort,
    sniPort,
    port,
    statsPort,
    resStatsPort,
    uiPort,
    rulesPort,
    resRulesPort,
    tunnelRulesPort,
    tunnelPort;
  var reqWritePort, reqReadPort, resWritePort, resReadPort;
  var wsReqWritePort, wsReqReadPort, wsResWritePort, wsResReadPort;
  var tunnelReqWritePort,
    tunnelReqReadPort,
    tunnelResWritePort,
    tunnelResReadPort;
  var upgrade;
  var callbackHandler = function () {
    pluginInited = true;
    callback(null, {
      authPort,
      sniPort,
      port: port,
      upgrade: upgrade,
      statsPort: statsPort,
      resStatsPort: resStatsPort,
      uiPort: uiPort,
      rulesPort: rulesPort,
      resRulesPort: resRulesPort,
      tunnelRulesPort: tunnelRulesPort,
      tunnelPort: tunnelPort,
      reqWritePort: reqWritePort,
      reqReadPort: reqReadPort,
      resWritePort: resWritePort,
      resReadPort: resReadPort,
      wsReqWritePort: wsReqWritePort,
      wsReqReadPort: wsReqReadPort,
      wsResWritePort: wsResWritePort,
      wsResReadPort: wsResReadPort,
      tunnelReqWritePort: tunnelReqWritePort,
      tunnelReqReadPort: tunnelReqReadPort,
      tunnelResWritePort: tunnelResWritePort,
      tunnelResReadPort: tunnelResReadPort
    });
  };

  try {
    require.resolve(options.value);
  } catch (e) {
    return callbackHandler();
  }
  options.LRU = LRU;
  var cgiHeaders = {};
  cgiHeaders[PROXY_ID_HEADER] = options.shortName.substring(8);
  cgiHeaders['x-whistle-auth-key'] = authKey;
  var parseCgiUrl = function (url) {
    var opts = parseUrl(url);
    opts.headers = cgiHeaders;
    return opts;
  };
  var topOpts = parseCgiUrl(baseUrl + 'top');
  var rulesUrlOpts = parseCgiUrl(baseUrl + 'rules/list2');
  var valuesUrlOpts = parseCgiUrl(baseUrl + 'values/list2');
  var pluginsOpts = parseCgiUrl(baseUrl + 'plugins/get-plugins?');
  var composeOpts = parseCgiUrl(baseUrl + 'composer');
  var certsInfoUrlOpts = parseCgiUrl(baseUrl + 'get-custom-certs-info');
  var enableOpts = parseCgiUrl(baseUrl + 'plugins/is-enable');
  var updateRulesOpts = parseCgiUrl(baseUrl + 'plugins/update-rules');
  var httpsStatusOpts = parseCgiUrl(baseUrl + 'https-status');
  var updateTimer;
  composeOpts.method = 'POST';
  composeOpts.headers['Content-Type'] = 'application/json';
  var requestCgi = function (opts, cb) {
    if (typeof cb !== 'function') {
      return;
    }
    request(opts, function (err, body, res) {
      if (body && res.statusCode == 200) {
        try {
          return cb(JSON.parse(body) || '', res);
        } catch (e) {}
      }
      cb('', res, err);
    });
  };

  var getValue = function (key, cb) {
    if (typeof cb !== 'function') {
      return;
    }
    if (!key || typeof key !== 'string') {
      return cb();
    }
    var valueOpts = parseCgiUrl(
      baseUrl + 'values/value?key=' + encodeURIComponent(key)
    );
    requestCgi(valueOpts, function (data) {
      if (!data) {
        return getValue(key, cb);
      }
      cb(data.value);
    });
  };

  var getCert = function (domain, callback) {
    if (!domain || typeof domain !== 'string') {
      return callback('');
    }
    var index = domain.indexOf(':');
    if (index !== -1) {
      domain = domain.substring(0, index);
      if (!domain) {
        return callback('');
      }
    }
    if (domain !== 'rootCA') {
      domain = domain.toLowerCase();
    }
    var cert = certsCache.get(domain);
    if (cert) {
      return callback(cert);
    }
    var cbs = certsCallbacks[domain];
    if (cbs) {
      return cbs.push(callback);
    }
    cbs = [callback];
    certsCallbacks[domain] = cbs;
    var opts = parseCgiUrl(baseUrl + 'get-cert?domain=' + domain);
    requestCgi(opts, function (cert) {
      cert && certsCache.set(domain, cert);
      delete certsCallbacks[domain];
      cbs.forEach(function (cb) {
        cb(cert);
      });
    });
  };

  options.getValue = getValue;
  options.getCert = getCert;
  options.getRootCA = function (callback) {
    return getCert('rootCA', callback);
  };
  options.getHttpsStatus = function (callback) {
    requestCgi(httpsStatusOpts, callback);
  };
  options.getTop =
    options.getRuntimeInfo =
    options.getProcessData =
    options.getPerfData =
      function (callback) {
        requestCgi(topOpts, callback);
      };

  var waitingUpdateRules;
  var updateRules = function () {
    requestCgi(updateRulesOpts, noop);
    if (waitingUpdateRules) {
      waitingUpdateRules = false;
      updateTimer = setTimeout(updateRules, 300);
    } else {
      updateTimer = null;
    }
  };
  options.updateRules = function () {
    if (updateTimer) {
      waitingUpdateRules = true;
    } else {
      updateTimer = setTimeout(updateRules, 600);
    }
  };
  options.composer = options.compose = function (data, cb) {
    var needResponse = typeof cb === 'function';
    if (!data) {
      return needResponse ? cb() : '';
    }
    data.needResponse = needResponse;
    if (data.headers && typeof data.headers !== 'string') {
      data.headers = JSON.stringify(data.headers);
    }
    if (data.base64) {
      delete data.body;
      if (Buffer.isBuffer(data.base64)) {
        data.base64 = data.base64.toString('base64');
      }
    } else if (Buffer.isBuffer(data.body)) {
      data.base64 = data.body.toString('base64');
      delete data.body;
    }
    composeOpts.body = data;
    request(composeOpts, function (err, body, res) {
      if (!needResponse) {
        return;
      }
      if (!err && res.statusCode == 200) {
        try {
          return cb(err, JSON.parse(body));
        } catch (e) {}
      }
      cb(err || new Error(res.statusCode || 'unknown'));
    });
  };

  options.getRules = function (cb) {
    requestCgi(rulesUrlOpts, cb);
  };
  options.getValues = function (cb) {
    requestCgi(valuesUrlOpts, cb);
  };
  options.getPlugins = function(cb) {
    requestCgi(pluginsOpts, cb);
  };
  var certsInfo;
  options.getCustomCertsInfo = function (cb) {
    if (typeof cb !== 'function') {
      return;
    }
    if (certsInfo) {
      return cb(certsInfo);
    }
    requestCgi(certsInfoUrlOpts, function (data) {
      certsInfo = certsInfo || data;
      cb(certsInfo);
    });
  };
  var enableCallbacks = [];
  options.isEnable = options.isActive = function (cb) {
    if (typeof cb !== 'function') {
      return;
    }
    enableCallbacks.push(cb);
    if (enableCallbacks.length > 1) {
      return;
    }
    var checkEnable = function () {
      requestCgi(enableOpts, function (data, r) {
        if (!data) {
          return setTimeout(checkEnable, 600);
        }
        enableCallbacks.forEach(function (callback) {
          callback(data.enable);
        });
        enableCallbacks = [];
      });
    };
    checkEnable();
  };
  var initProxy = function(cb) {
    getProxy({
      PROXY_ID_HEADER: PROXY_ID_HEADER,
      proxyIp: boundIp,
      proxyPort: boundPort,
      pluginName: pluginName,
      wrapWsReader: wrapWsReader,
      wrapWsWriter: wrapWsWriter
    }, cb);
  };
  var initServers = function (_ctx) {
    ctx = _ctx || ctx;
    var execPlugin = require(options.value) || '';
    var execAuth =
      getFunction(execPlugin.auth) || getFunction(execPlugin.verify);
    var sniCallback =
      getFunction(execPlugin.sniCallback) ||
      getFunction(execPlugin.SNICallback);
    var startServer = getFunction(
      execPlugin.pluginServer || execPlugin.server || execPlugin
    );
    var startStatsServer = getFunction(
      execPlugin.statServer ||
        execPlugin.statsServer ||
        execPlugin.reqStatServer ||
        execPlugin.reqStatsServer
    );
    var startResStatsServer = getFunction(
      execPlugin.resStatServer || execPlugin.resStatsServer
    );
    var startUIServer = getFunction(
      execPlugin.uiServer || execPlugin.innerServer || execPlugin.internalServer
    );
    var startRulesServer = getFunction(
      execPlugin.pluginRulesServer ||
        execPlugin.rulesServer ||
        execPlugin.reqRulesServer
    );
    var startResRulesServer = getFunction(execPlugin.resRulesServer);
    var startTunnelRulesServer = getFunction(
      execPlugin.pluginRulesServer || execPlugin.tunnelRulesServer
    );
    var startTunnelServer =
      getFunction(
        execPlugin.pluginServer ||
          execPlugin.tunnelServer ||
          execPlugin.connectServer
      ) || startServer;
    var startReqRead = getFunction(
      execPlugin.reqRead || execPlugin.reqReadServer
    );
    var startReqWrite = getFunction(
      execPlugin.reqWrite || execPlugin.reqWriteServer
    );
    var startResRead = getFunction(
      execPlugin.resRead || execPlugin.resReadServer
    );
    var startResWrite = getFunction(
      execPlugin.resWrite || execPlugin.resWriteServer
    );
    var startWsReqRead = getFunction(
      execPlugin.wsReqRead || execPlugin.wsReqReadServer
    );
    var startWsReqWrite = getFunction(
      execPlugin.wsReqWrite || execPlugin.wsReqWriteServer
    );
    var startWsResRead = getFunction(
      execPlugin.wsResRead || execPlugin.wsResReadServer
    );
    var startWsResWrite = getFunction(
      execPlugin.wsResWrite || execPlugin.wsResWriteServer
    );
    var startTunnelReqRead = getFunction(
      execPlugin.tunnelReqRead || execPlugin.tunnelReqReadServer
    );
    var startTunnelReqWrite = getFunction(
      execPlugin.tunnelReqWrite || execPlugin.tunnelReqWriteServer
    );
    var startTunnelResRead = getFunction(
      execPlugin.tunnelResRead || execPlugin.tunnelResReadServer
    );
    var startTunnelResWrite = getFunction(
      execPlugin.tunnelResWrite || execPlugin.tunnelResWriteServer
    );
    var staticDir = !startUIServer && options.staticDir;
    if (staticDir) {
      var app = express();
      startUIServer = function (server) {
        app.use(
          express.static(path.join(options.value, staticDir), {
            maxAge: 60000
          })
        );
        server.on('request', app);
      };
    }
    var hasServer =
      execAuth ||
      sniCallback ||
      startServer ||
      startStatsServer ||
      startResStatsServer ||
      startUIServer ||
      startRulesServer ||
      startResRulesServer ||
      startTunnelRulesServer ||
      startTunnelServer ||
      startReqRead ||
      startReqWrite ||
      startResRead ||
      startResWrite ||
      startWsReqRead ||
      startWsReqWrite ||
      startWsResRead ||
      startWsResWrite ||
      startTunnelReqRead ||
      startTunnelReqWrite ||
      startTunnelResRead ||
      startTunnelResWrite;

    if (!hasServer) {
      return callbackHandler();
    }
    getServer(async function (server, _port) {
      var maxWsPayload;
      var authServer,
        sniServer,
        uiServer,
        httpServer,
        statsServer,
        resStatsServer;
      var rulesServer, resRulesServer, tunnelRulesServer, tunnelServer;
      var reqRead, reqWrite, resWrite, resRead;
      var wsReqRead, wsReqWrite, wsResWrite, wsResRead;
      var tunnelReqRead, tunnelReqWrite, tunnelResWrite, tunnelResRead;
      var setMaxWsPayload = function (payload) {
        maxWsPayload = parseInt(payload, 10) || 0;
      };
      options.ctx = ctx;
      if (startUIServer) {
        uiServer = createServer();
        await startUIServer(uiServer, options);
        uiPort = _port;
      }

      var transferError = function (req, res) {
        res.once('error', function (err) {
          req.emit('error', err);
        });
        res.once('close', function (err) {
          req.emit('close', err);
        });
      };

      if (execAuth) {
        authServer = createServer();
        authServer.on('request', async function (req, res) {
          initReq(req, res);
          transferError(req, res);
          var customHeaders = {};
          var htmlBody, htmlUrl, location;
          var setHeader = function (key, value) {
            if (
                !notEmptyStr(key) ||
                NOT_NAME_RE.test(key) ||
                typeof value !== 'string'
              ) {
              return;
            }
            key = key.toLowerCase();
            if (
                key.indexOf('x-whistle-') === 0 ||
                key === 'proxy-authorization'
              ) {
              customHeaders[key] = value;
            }
          };
          req.setHtml = function (html) {
            if (!html || html == null) {
              htmlBody = null;
            } else if (typeof html === 'string' || Buffer.isBuffer(html)) {
              htmlBody = html;
              location = null;
              htmlUrl = null;
            }
          };
          req.setUrl = req.setFile = function (url) {
            if (!url || /[\s]/.test(url)) {
              htmlUrl = null;
            } else {
              htmlUrl = url;
              location = null;
              htmlBody = null;
              req.showLoginBox = false;
            }
          };
          req.set = req.setHeader = setHeader;
          req.setRedirect = function (url) {
            if (!url) {
              location = null;
            } else if (URL_RE.test(url)) {
              location = url;
              htmlBody = null;
              htmlUrl = null;
              req.showLoginBox = false;
            }
          };
          req.setLogin = function (login) {
            req.showLoginBox = login !== false;
            if (req.showLoginBox) {
              location = null;
              htmlUrl = null;
            }
          };
          try {
            var result = await execAuth(req, options);
            if (req.showLoginBox) {
              customHeaders[SHOW_LOGIN_BOX] = '1';
            }
            if (result === false) {
              customHeaders['x-auth-status'] = '1';
              if (location) {
                customHeaders.location = location;
              } else if (htmlUrl) {
                customHeaders['x-auth-html-url'] =
                    encodeURIComponent(htmlUrl);
              } else if (typeof htmlBody === 'string') {
                htmlBody = Buffer.from(htmlBody);
                if (htmlBody.length > MAX_BODY_SIZE) {
                  htmlBody = htmlBody.slice(0, MAX_BODY_SIZE);
                }
              }
              htmlBody = htmlBody || 'Forbidden';
            } else {
              htmlBody = null;
            }
            res.writeHead(200, customHeaders);
            res.end(htmlBody);
          } catch (e) {
            res.end(
                e && e.message && typeof e.message === 'string'
                  ? e.message
                  : 'Error'
              );
          }
          htmlBody = null;
        });
        authPort = _port;
      }

      if (sniCallback) {
        sniServer = createServer();
        sniServer.on('request', async function (req, res) {
          initReq(req, res);
          transferError(req, res);
          try {
            var result = await sniCallback(req, options);
            if (result === false || result === true) {
              res.end(result + '');
            } else if (
                result &&
                notEmptyStr(result.key) &&
                notEmptyStr(result.cert)
              ) {
              res.end(
                  JSON.stringify({
                    key: result.key,
                    cert: result.cert,
                    mtime: result.mtime > 0 ? result.mtime : undefined,
                    name: pluginName
                  })
                );
            } else {
              res.end();
            }
          } catch (e) {
            res.end(
                e && e.message && typeof e.message === 'string'
                  ? e.message
                  : 'Error'
              );
          }
        });
        sniPort = _port;
      }

      if (startServer) {
        httpServer = createServer();
        await startServer(httpServer, options);
        upgrade = listenerCount(httpServer, 'upgrade');
        port = _port;
      }

      if (startStatsServer) {
        statsServer = createServer();
        await startStatsServer(statsServer, options);
        statsPort = _port;
      }

      if (startResStatsServer) {
        resStatsServer = createServer();
        await startResStatsServer(resStatsServer, options);
        resStatsPort = _port;
      }

      if (startRulesServer) {
        rulesServer = createServer();
        await startRulesServer(rulesServer, options);
        rulesPort = _port;
      }

      if (startResRulesServer) {
        resRulesServer = createServer();
        await startResRulesServer(resRulesServer, options);
        resRulesPort = _port;
      }

      if (startTunnelRulesServer) {
        if (startTunnelRulesServer === startRulesServer) {
          tunnelRulesServer = rulesServer;
        } else {
          tunnelRulesServer = createServer();
          await startTunnelRulesServer(tunnelRulesServer, options);
        }
        tunnelRulesPort = _port;
      }

      if (startTunnelServer) {
        if (startTunnelServer === startServer) {
          if (listenerCount(httpServer, 'connect')) {
            tunnelServer = httpServer;
            tunnelPort = _port;
          }
        } else {
          tunnelServer = createServer();
          await startTunnelServer(tunnelServer, options);
          tunnelPort = _port;
        }
      }

      if (startReqRead) {
        reqRead = createServer();
        await startReqRead(reqRead, options);
        reqReadPort = _port;
      }

      if (startReqWrite) {
        reqWrite = createServer();
        await startReqWrite(reqWrite, options);
        reqWritePort = _port;
      }

      if (startResRead) {
        resRead = createServer();
        await startResRead(resRead, options);
        resReadPort = _port;
      }

      if (startResWrite) {
        resWrite = createServer();
        await startResWrite(resWrite, options);
        resWritePort = _port;
      }

      if (startWsReqRead) {
        wsReqRead = createServer();
        wsReqRead.setMaxWsPayload = setMaxWsPayload;
        await startWsReqRead(wsReqRead, options);
        wsReqReadPort = _port;
      }

      if (startWsReqWrite) {
        wsReqWrite = createServer();
        wsReqWrite.setMaxWsPayload = setMaxWsPayload;
        await startWsReqWrite(wsReqWrite, options);
        wsReqWritePort = _port;
      }

      if (startWsResRead) {
        wsResRead = createServer();
        wsResRead.setMaxWsPayload = setMaxWsPayload;
        await startWsResRead(wsResRead, options);
        wsResReadPort = _port;
      }

      if (startWsResWrite) {
        wsResWrite = createServer();
        wsResWrite.setMaxWsPayload = setMaxWsPayload;
        await startWsResWrite(wsResWrite, options);
        wsResWritePort = _port;
      }

      if (startTunnelReqRead) {
        tunnelReqRead = createServer();
        await startTunnelReqRead(tunnelReqRead, options);
        tunnelReqReadPort = _port;
      }

      if (startTunnelReqWrite) {
        tunnelReqWrite = createServer();
        await startTunnelReqWrite(tunnelReqWrite, options);
        tunnelReqWritePort = _port;
      }

      if (startTunnelResRead) {
        tunnelResRead = createServer();
        await startTunnelResRead(tunnelResRead, options);
        tunnelResReadPort = _port;
      }

      if (startTunnelResWrite) {
        tunnelResWrite = createServer();
        await startTunnelResWrite(tunnelResWrite, options);
        tunnelResWritePort = _port;
      }
      server.timeout = config.timeout;
      server.on('request', function (req, res) {
        delete req.headers['x-whistle-internal-id'];
        switch (getHookName(req)) {
        case PLUGIN_HOOKS.AUTH:
          if (authServer) {
            setContext(req);
            authServer.emit('request', req, res);
          }
          break;
        case PLUGIN_HOOKS.SNI:
          if (sniServer) {
            setContext(req);
            sniServer.emit('request', req, res);
          }
          break;
        case PLUGIN_HOOKS.UI:
          if (uiServer) {
            setContext(req);
            uiServer.emit('request', req, res);
          }
          break;
        case PLUGIN_HOOKS.HTTP:
          if (httpServer) {
            initReq(req, res, true);
            var alpnProtocol = req.headers[config.ALPN_PROTOCOL_HEADER];
            var curUrl = req.originalReq.realUrl;
            var svrRes = '';
            var reqRules, resRules;
            var writeHead = res.writeHead;
            req.setReqRules = res.setReqRules = function (rules) {
              reqRules = rules;
              return true;
            };
            req.setResRules = res.setResRules = function (rules) {
              resRules = rules;
              return true;
            };
            req.writeHead = res.writeHead = function (code, msg, headers) {
              code = code > 0 ? code : svrRes.statusCode || 101;
              if (msg && typeof msg !== 'string') {
                headers = headers || msg;
                msg = null;
              }
              msg = msg || STATUS_CODES[code] || '';
              headers = headers || svrRes.headers;
              if (resRules) {
                headers = headers || {};
                headers[RES_RULES_HEAD] = getRulesStr(resRules);
                req.setResRules = res.setResRules = noop;
                resRules = null;
              }
              headers = formatRawHeaders(headers, svrRes);
              writeHead.call(res, code, msg, headers);
              res.emit('_wroteHead');
            };
            req.request = function (uri, cb, opts) {
              var args = normalizeArgs(
                    uri,
                    cb,
                    req,
                    curUrl,
                    false,
                    opts,
                    alpnProtocol
                  );
              uri = args[0];
              cb = args[1];
              opts = args[3];
              uri.agent = false;
              req.setReqRules = res.setReqRules = noop;
              setReqRules(uri, reqRules);
              reqRules = null;
              var client = (args[2] ? httpsRequest : httpRequest)(
                    uri,
                    function (_res) {
                      svrRes = _res;
                      res.once('_wroteHead', function () {
                        appendTrailers(_res, res, opts && opts.trailers, req);
                      });
                      if (typeof cb === 'function') {
                        cb.call(this, _res);
                      } else {
                        res.writeHead();
                        _res.pipe(res);
                      }
                    }
                  );
              addErrorHandler(req, client);
              return client;
            };
            req.passThrough = function (uri, newTrailers) {
              var client = req.request(uri, function (_res) {
                res.writeHead(
                      _res.statusCode,
                      _res.statusMessage,
                      _res.headers
                    );
                appendTrailers(_res, res, newTrailers, req);
                _res.pipe(res);
              });
              req.pipe(client);
            };
            httpServer.emit('request', req, res);
          }
          break;
        case PLUGIN_HOOKS.REQ_STATS:
          if (statsServer) {
            initReq(req, res);
            statsServer.emit('request', req, res);
            res.end();
          }
          break;
        case PLUGIN_HOOKS.RES_STATS:
          if (resStatsServer) {
            initReq(req, res);
            resStatsServer.emit('request', req, res);
            res.end();
          }
          break;
        case PLUGIN_HOOKS.REQ_RULES:
          if (rulesServer) {
            initReq(req, res);
            rulesServer.emit('request', req, res);
          }
          break;
        case PLUGIN_HOOKS.RES_RULES:
          if (resRulesServer) {
            initReq(req, res);
            resRulesServer.emit('request', req, res);
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_RULES:
          if (tunnelRulesServer) {
            initReq(req, res);
            tunnelRulesServer.emit('request', req, res);
          }
          break;
        default:
          res.destroy();
        }
      });
      server.on('upgrade', function (req, socket, head) {
        switch (getHookName(req)) {
        case PLUGIN_HOOKS.UI:
          if (uiServer) {
            setContext(req);
            uiServer.emit('upgrade', req, socket, head);
          }
          break;
        case PLUGIN_HOOKS.HTTP:
          if (httpServer) {
            initWsReq(req, socket);
            var curUrl = req.originalReq.realUrl;
            httpServer.setMaxWsPayload = setMaxWsPayload;
            var svrRes = '';
            var reqRules, resRules;
            req.setReqRules = socket.setReqRules = function (rules) {
              reqRules = rules;
              return true;
            };
            req.setResRules = socket.setResRules = function (rules) {
              resRules = rules;
              return true;
            };
            req.writeHead = socket.writeHead = function (
                  code,
                  msg,
                  headers
                ) {
              code = code > 0 ? code : svrRes.statusCode || 101;
              if (msg && typeof msg !== 'string') {
                headers = headers || msg;
                msg = null;
              }
              headers = headers || svrRes.headers;
              if (resRules) {
                headers = headers || {};
                headers[RES_RULES_HEAD] = getRulesStr(resRules);
                req.setResRules = socket.setResRules = noop;
                resRules = null;
              }
              headers = [
                'HTTP/1.1 ' +
                      code +
                      ' ' +
                      (msg || svrRes.statusMessage || STATUS_CODES[code] || ''),
                headers
                      ? getRawHeaders(formatRawHeaders(headers, svrRes))
                      : '',
                '\r\n'
              ];
              socket.write(headers.join('\r\n'), 'binary');
            };
            req.request = function (uri, cb, opts) {
              var args = normalizeArgs(uri, cb, req, curUrl, true, opts);
              uri = args[0];
              cb = args[1];
              opts = args[3];
              uri.agent = false;
              req.setReqRules = socket.setReqRules = noop;
              setReqRules(uri, reqRules);
              reqRules = null;
              var client = (args[2] ? httpsRequest : httpRequest)(uri);
              var rawFrame;
              if (opts === true) {
                rawFrame = true;
              } else if (opts) {
                rawFrame = opts.rawFrame;
              }
              client.once('response', function(_res) {
                svrRes = _res;
                socket.writeHead();
                _res.pipe(socket);
              });
              client.once('upgrade', function (_res, resSocket) {
                svrRes = _res;
                if (rawFrame !== true && common.isWebSocket(svrRes.headers)) {
                  var clientParser = addFrameHandler(
                        _res,
                        socket,
                        maxWsPayload,
                        true,
                        false
                      );
                  var serverParser = addFrameHandler(
                        _res,
                        resSocket,
                        maxWsPayload,
                        false,
                        true
                      );
                  handleWsSignal(
                        clientParser.receiver,
                        serverParser.sender
                      );
                  handleWsSignal(
                        serverParser.receiver,
                        clientParser.sender
                      );
                }
                if (typeof cb === 'function') {
                  resSocket.headers = _res.headers;
                  resSocket.statusCode = _res.statusCode;
                  resSocket.statusMessage = _res.statusMessage;
                  cb(resSocket);
                } else {
                  socket.writeHead();
                  socket.pipe(resSocket).pipe(socket);
                }
              });
              addErrorHandler(req, client);
              client.end();
              return client;
            };
            req.passThrough = function (uri) {
              req.request(
                    uri,
                    function (resSock) {
                      socket.writeHead(
                        resSock.statusCode,
                        resSock.statusMessage,
                        resSock.headers
                      );
                      resSock.pipe(socket).pipe(resSock);
                    },
                    true
                  );
            };
            httpServer.emit('upgrade', req, socket, head);
          }
          break;
        default:
          socket.destroy();
        }
      });

      var emitHttpPipe = function (httpServer, req, socket) {
        if (httpServer) {
          initConnectReq(req, socket);
          req.sendEstablished(function () {
            var decoder = getDecodeTransform();
            var encoder = getEncodeTransform();
            var done;
            var handleError = function (err) {
              if (!done) {
                done = true;
                socket.emit('error', err || new Error('destroyed'));
              }
            };
            socket.on('error', function (err) {
              if (!done) {
                done = true;
                decoder.emit('error', err);
                encoder.emit('error', err);
              }
            });
            encoder.once('finish', function () {
              done = true;
            });
            socket.on('close', function () {
              done = true;
              decoder.emit('close');
              encoder.emit('close');
            });
            decoder.destroy = encoder.destroy = handleError;
            decoder.on('error', handleError);
            encoder.on('error', handleError);
            ADDITIONAL_FIELDS.forEach(function (key) {
              decoder[key] = req[key];
            });
            socket.pipe(decoder);
            encoder.pipe(socket);
            socket.on('end', destroySocket);
            httpServer.emit('request', decoder, encoder);
          });
        }
      };

      function pipeUpgrade(pipeSvr, req, socket, head, fromClient, toServer) {
        if (pipeSvr) {
          initConnectReq(req, socket);
          req.sendEstablished(function () {
            addFrameHandler(req, socket, maxWsPayload, fromClient, toServer);
            pipeSvr.emit('connect', req, socket, head);
          });
        }
      }

      server.on('connect', function (req, socket, head) {
        var isUp = isUpgrade(req);
        var pipeServer;
        switch (getHookName(req)) {
        case PLUGIN_HOOKS.REQ_READ:
          emitHttpPipe(reqRead, req, socket);
          break;
        case PLUGIN_HOOKS.REQ_WRITE:
          emitHttpPipe(reqWrite, req, socket);
          break;
        case PLUGIN_HOOKS.RES_READ:
          emitHttpPipe(resRead, req, socket);
          break;
        case PLUGIN_HOOKS.RES_WRITE:
          emitHttpPipe(resWrite, req, socket);
          break;
        case PLUGIN_HOOKS.WS_REQ_READ:
          pipeUpgrade(wsReqRead, req, socket, head, true, true);
          break;
        case PLUGIN_HOOKS.WS_REQ_WRITE:
          pipeUpgrade(wsReqWrite, req, socket, head, true, true);
          break;
        case PLUGIN_HOOKS.WS_RES_READ:
          pipeUpgrade(wsResRead, req, socket, head);
          break;
        case PLUGIN_HOOKS.WS_RES_WRITE:
          pipeUpgrade(wsResWrite, req, socket, head);
          break;
        case PLUGIN_HOOKS.TUNNEL:
          if (tunnelServer) {
            initConnectReq(req, socket);
            req.sendEstablished(function () {
              req.writeHead = socket.writeHead = function (
                    code,
                    msg,
                    headers
                  ) {
                if (msg && typeof msg !== 'string') {
                  headers = headers || msg;
                  msg = null;
                }
                code = code > 0 ? code : 200;
                msg = msg || STATUS_CODES[code] || 'unknown';
                socket.write(
                [
                  'HTTP/1.1 ' + code + ' ' + msg,
                  headers ? getRawHeaders(headers) : '',
                  '\r\n'
                ].join('\r\n')
                    );
              };
              req.connect = function (uri, cb, opts) {
                var headers = extractHeaders(req, pluginKeyMap);
                var policy = headers['x-whistle-policy'];
                if (TUNNEL_HOST_RE.test(uri)) {
                  headers.host = uri;
                } else if (typeof uri === 'function') {
                  opts = cb;
                  cb = uri;
                } else if (uri) {
                  if (TUNNEL_HOST_RE.test(uri.url)) {
                    if (uri.headers) {
                      headers = extend({}, uri.headers);
                      if (policy && !headers['x-whistle-policy']) {
                        headers['x-whistle-policy'] = policy;
                      }
                    }
                    headers.host = uri.url;
                    if (cb && typeof cb !== 'function') {
                      opts = cb;
                      cb = null;
                    }
                  } else {
                    opts = uri;
                  }
                }
                uri = {
                  method: 'CONNECT',
                  agent: false,
                  path: headers.host
                };
                if (!opts || !notEmptyStr(opts.host)) {
                  headers[PROXY_ID_HEADER] = req[REQ_ID_KEY];
                  uri.host = boundIp;
                  uri.port = boundPort;
                  if (req.originalReq) {
                    headers[REMOTE_ADDR_HEAD] =
                          req.originalReq.remoteAddress;
                    headers[REMOTE_PORT_HEAD] = req.originalReq.remotePort;
                  }
                } else {
                  uri.host = opts.host;
                  uri.port = opts.port > 0 ? opts.port : 80;
                }
                uri.headers = formatRawHeaders(headers, req);
                var client = httpRequest(uri);
                client.on('connect', function (_res, svrSock) {
                  if (_res.statusCode !== 200) {
                    var err = new Error(
                          'Tunneling socket could not be established, statusCode=' +
                            _res.statusCode
                        );
                    err.statusCode = _res.statusCode;
                    svrSock.destroy();
                    process.nextTick(function () {
                      client.emit('error', err);
                    });
                    return;
                  }
                  if (_res.headers['x-whistle-allow-tunnel-ack']) {
                    svrSock.write('1');
                  }
                  if (typeof cb === 'function') {
                    svrSock.headers = _res.headers;
                    svrSock.statusCode = 200;
                    cb(svrSock);
                  } else {
                    svrSock.pipe(socket).pipe(svrSock);
                  }
                });
                addErrorHandler(req, client);
                client.end();
                return client;
              };
              req.passThrough = function (uri) {
                req.connect(uri, function (svrSock) {
                  svrSock.pipe(socket).pipe(svrSock);
                });
              };
              tunnelServer.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_REQ_READ:
          pipeServer = isUp ? wsReqRead : tunnelReqRead;
          if (pipeServer) {
            initConnectReq(req, socket);
            req.sendEstablished(function () {
              socket.headers = req.headers;
              if (isUp ? wsReqWrite : tunnelReqWrite) {
                wrapTunnelWriter(socket);
              }
              pipeServer.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_REQ_WRITE:
          pipeServer = isUp ? wsReqWrite : tunnelReqWrite;
          if (pipeServer) {
            initConnectReq(req, socket);
            req.sendEstablished(function () {
              if (isUp ? wsReqRead : tunnelReqRead) {
                wrapTunnelReader(socket);
              }
              pipeServer.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_RES_READ:
          pipeServer = isUp ? wsResRead : tunnelResRead;
          if (pipeServer) {
            initConnectReq(req, socket);
            req.sendEstablished(function () {
              socket.headers = req.headers;
              if (isUp ? wsResWrite : tunnelResWrite) {
                wrapTunnelWriter(socket);
              }
              pipeServer.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_RES_WRITE:
          pipeServer = isUp ? wsResWrite : tunnelResWrite;
          if (pipeServer) {
            initConnectReq(req, socket);
            req.sendEstablished(function () {
              if (isUp ? wsResRead : tunnelResRead) {
                wrapTunnelReader(socket);
              }
              pipeServer.emit('connect', req, socket, head);
            });
          }
          break;
        default:
          socket.destroy();
        }
      });
      callbackHandler();
    }
    );
  };
  initProxy(async function(proxy) {
    options.connect = proxy.connect;
    options.request = proxy.request;
    var initial = loadModule(path.join(options.value, 'initial.js')) ||
    loadModule(path.join(options.value, 'initialize.js'));
    if (initial && typeof initial !== 'function') {
      initial = initial.default;
    }
    if (typeof initial === 'function') {
      if (initial.length === 2) {
        ctx = await initial(options, initServers);
        return ctx;
      }
      ctx = await initial(options);
    }
    initServers();
  });
};
