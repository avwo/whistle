require('../util/patch');
var path = require('path');
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

var getEncodeTransform = transproto.getEncodeTransform;
var getDecodeTransform = transproto.getDecodeTransform;

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
var MAX_BUF_LEN = 1024 * 200;
var TIMEOUT = 300;
var REQ_INTERVAL = 16;
var pluginOpts, storage;
var pluginKeyMap = {};
var MASK_OPTIONS = { mask: true };
/* eslint-disable no-undef */
var REQ_ID_KEY = typeof Symbol === 'undefined' ? '$reqId_' + Date.now() : Symbol();
var SESSION_KEY = typeof Symbol === 'undefined' ? '$session_' + Date.now() : Symbol();
var FRAME_KEY = typeof Symbol === 'undefined' ? '$frame_' + Date.now() : Symbol();
var REQ_KEY = typeof Symbol === 'undefined' ? '$req_' + Date.now() : Symbol();
var CLOSED = typeof Symbol === 'undefined' ? '$colsed_' + Date.now() : Symbol();
/* eslint-enable no-undef */
var index = 1000;
var noop = function() {};
var ctx, PLUGIN_HOOK_NAME_HEADER;

var appendTrailers = function(_res, res, newTrailers, req) {
  if (res.disableTrailer || res.disableTrailers) {
    return;
  }
  common.addTrailerNames(_res, newTrailers, null, null, req);
  common.onResEnd(_res, function() {
    var trailers = _res.trailers;
    if (!res.chunkedEncoding || (common.isEmptyObject(trailers) && common.isEmptyObject(newTrailers))) {
      return;
    }
    var rawHeaderNames = _res.rawTrailers ? getRawHeaderNames(_res.rawTrailers) : {};
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

var requestData = function(options, callback) {
  request(options, function(err, body) {
    if (err) {
      return callback(err);
    }
    try {
      return callback(null, JSON.parse(body));
    } catch(e) {
      return callback(e);
    }
  });
};

var getValue = function(req, name) {
  var value = req.headers[name] || '';
  try {
    return value ? decodeURIComponent(value) : '';
  } catch(e) {}
  return String(value);
};
var setContext = function(req) {
  if (ctx) {
    ctx.request = req;
    req.ctx = ctx;
  }
  req.localStorage = storage;
  req.Storage = Storage;
  req.clientIp = getValue(req, pluginOpts.CLIENT_IP_HEADER) || '127.0.0.1';
};

var initState = function(req, name) {
  switch(name) {
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

var addFrame = function(frame) {
  framesList.push(frame);
  if (framesList.length > 600) {
    framesList.splice(0, 80);
  }
};

var getFrameOpts = function(opts) {
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
var pushFrame = function(reqId, data, opts, isClient) {
  if (data == null) {
    return;
  }
  if (!Buffer.isBuffer(data)) {
    try {
      if (typeof data !== 'string') {
        data = JSON.stringify(data);
      }
      data = Buffer.from(data);
    } catch(e) {
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
var addParserApi = function(req, conn, state, reqId) {
  state = state.split(',').forEach(function(name) {
    initState(req, name);
  });
  req.on('clientFrame', function(data, opts) {
    pushFrame(reqId, data, opts, true);
  });
  req.on('serverFrame', function(data, opts) {
    pushFrame(reqId, data, opts);
  });
  var on = req.on;
  req.on = function(eventName) {
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
  var emitDisconnect = function(err) {
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
  parserCallbacks[reqId] = function(data) {
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
      } catch(e) {}
    }
    var curReceiveState = req.curReceiveState;
    if (curReceiveState != receiveState) {
      req.prevReceiveState = req.curReceiveState;
      req.curReceiveState = receiveState;
      try {
        req.emit('receiveStateChange', req.curReceiveState, req.prevReceiveState);
      } catch(e) {}
    }
    if (Array.isArray(data.toClient)) {
      data.toClient.forEach(function(frame) {
        var buf = toBuffer(frame.base64);
        try {
          buf && req.emit('sendToClient', buf, frame.binary);
        } catch(e) {}
      });
    }
    if (Array.isArray(data.toServer)) {
      data.toServer.forEach(function(frame) {
        var buf = toBuffer(frame.base64);
        try {
          buf && req.emit('sendToServer', buf, frame.binary);
        } catch(e) {}
      });
    }
  };
  retryCustomParser();
};

var addSessionStorage = function(req, id) {
  req.sessionStorage = {
    set: function(key, value) {
      var cache = sessionStorage.get(id); 
      if (!cache) {
        cache = {};
        sessionStorage.set(id, cache); 
      }
      cache[key] = value;
      return value;
    },
    get: function(key) {
      var cache = sessionStorage.get(id); 
      return cache && cache[key];
    },
    remove: function(key) {
      var cache = sessionStorage.peek(id);
      if (cache) {
        delete cache[key];
      }
    }
  };
};

var ADDITIONAL_FIELDS = [
  'headers',           'rawHeaders',
  'trailers',          'rawTrailers',
  'url',               'method',
  'statusCode',        'statusMessage',
  'sendEstablished',   'unsafe_getReqSession',
  'unsafe_getSession', 'unsafe_getFrames',
  'getReqSession',     'getSession',
  'getFrames',         'request',
  'originalReq',       'response',
  'originalRes',       'localStorage',
  'Storage',           'clientIp',
  'sessionStorage'
];

var initReq = function(req, res, isServer) {
  var destroy = function(e) {
    if (!req._hasError) {
      req._hasError = true;
      req.destroy && req.destroy(e);
      res.destroy && res.destroy(e);
    }
  };
  req.on('error', destroy);
  res.on('error', destroy);

  req.unsafe_getReqSession = function(cb) {
    return getSession(req, cb, true);
  };
  req.unsafe_getSession = function(cb) {
    return getSession(req, cb);
  };
  req.unsafe_getFrames = function(cb) {
    return getFrames(req, cb);
  };
  req.getReqSession = function(cb) {
    return getSession(req, cb, true);
  };
  req.getSession = function(cb) {
    return getSession(req, cb);
  };
  req.getFrames = function(cb) {
    return getFrames(req, cb);
  };

  var reqId = getValue(req, pluginOpts.REQ_ID_HEADER);
  var oReq = req.originalReq = req.request = {};
  var oRes = req.originalRes = req.response = {};
  setContext(req);
  oReq.clientIp = req.clientIp;
  if (isServer) {
    var customParserHeader = req.headers[pluginOpts.CUSTOM_PARSER_HEADER];
    if (customParserHeader && typeof customParserHeader === 'string') {
      addParserApi(req, res, customParserHeader, reqId);
      req.customParser = oReq.customParser = true;
    }
  }
  var headers = extractHeaders(req, pluginKeyMap);
  req[REQ_ID_KEY] = oReq.id = reqId;
  addSessionStorage(req, reqId);
  oReq.headers = headers;
  oReq.isFromPlugin = headers[pluginOpts.PLUGIN_REQUEST_HEADER] == '1';
  oReq.ruleValue = getValue(req, pluginOpts.RULE_VALUE_HEADER);
  oReq.ruleUrl = getValue(req, pluginOpts.RULE_URL_HEADER) || oReq.ruleValue;
  oReq.pipeValue = getValue(req, pluginOpts.PIPE_VALUE_HEADER);
  oReq.hostValue = getValue(req, pluginOpts.HOST_VALUE_HEADER);
  oReq.url = oReq.fullUrl = getValue(req, pluginOpts.FULL_URL_HEADER);
  oReq.realUrl = getValue(req, pluginOpts.REAL_URL_HEADER) || oReq.url;
  oReq.relativeUrl = getValue(req, pluginOpts.RELATIVE_URL_HEADER);
  oReq.method = getValue(req, pluginOpts.METHOD_HEADER) || 'GET';
  oReq.clientPort = getValue(req, pluginOpts.CLIENT_PORT_HEAD);
  oReq.globalValue = getValue(req, pluginOpts.GLOBAL_VALUE_HEAD);
  oReq.proxyValue = getValue(req, pluginOpts.PROXY_VALUE_HEADER);
  oReq.pacValue = getValue(req, pluginOpts.PAC_VALUE_HEADER);
  oRes.serverIp = getValue(req, pluginOpts.HOST_IP_HEADER) || '127.0.0.1';
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
  requestData(sessionOpts, function(err, result) {
    sessionPending = false;
    if (err || !result) {
      return retryRequestSession();
    }
    Object.keys(result).forEach(function(id) {
      var item = result[id];
      execCallback(id, reqCallbacks, item);
      execCallback(id, resCallbacks, item);
    });
    retryRequestSession(REQ_INTERVAL);
  });
};

var retryRequestFrames = function(time) {
  if (!framesTimer) {
    framesTimer = setTimeout(requestFrames, time || TIMEOUT);
  }
};
var requestFrames = function() { 
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
  framesPending = true;
  var query = '?curReqId=' + req[REQ_ID_KEY] + '&lastFrameId=' + (req[FRAME_KEY] || '');
  framesOpts.path = framesOpts.path.replace(QUERY_RE, query);
  requestData(framesOpts, function(err, result) {
    framesPending = false;
    if (err || !result) {
      framesCallbacks.push(cb);
      return retryRequestFrames();
    }
    var frames = result.frames;
    var closed = !frames;
    if (Array.isArray(frames)) {
      var last = frames[frames.length - 1];
      var frameId = last && last.frameId;
      if (frameId) {
        req[FRAME_KEY] = frameId;
        frames.forEach(defineProps);
        closed = !!(last.closed || last.err);
      }
    }
    if (!frames || frames.length) {
      try {
        cb(frames || '');
      } catch(e) {}
    } else {
      framesCallbacks.push(cb);
    }
    req[CLOSED] = closed;
    retryRequestFrames(REQ_INTERVAL);
  });
};

var retryCustomParser = function(time) {
  if (!customParserTimer) {
    customParserTimer = setTimeout(customParser, time || TIMEOUT);
  }
};

var customParser = function() {
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
  requestData(customParserOpts, function(err, result) {
    customParserPending = false;
    customParserOpts.body = undefined;
    if (err || !result) {
      return retryCustomParser();
    }
    idList.forEach(function(reqId) {
      var cb = parserCallbacks[reqId];
      cb && cb(result[reqId]);
    });
    retryCustomParser(framesList.length> 0 ? 20 : 300);
  });
};

var getFrames = function(req, cb) {
  var reqId = req[REQ_ID_KEY];
  if (!REQ_ID_RE.test(reqId) || typeof cb !== 'function') {
    return;
  }
  var url = req.originalReq.url;
  var isTunnel = !req[CLOSED] && /^tunnel/.test(url);
  if (!isTunnel && !/^ws/.test(url)) {
    return cb('');
  }
  cb[REQ_KEY] = req;
  framesCallbacks.push(cb);
  getSession(req, function(session) {
    if (!session || session.reqError || session.resError
        || (isTunnel && !session.inspect)) {
      framesCallbacks.forEach(function(_cb) {
        req[CLOSED] = 1;
        _cb('');
      });
      framesCallbacks = [];
      return;
    }
    requestFrames();
  });
};

var getSession = function(req, cb, isReq) {
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
  retryRequestSession();
};

var initWsReq = function(req, res) {
  initReq(req, res, true);
};
var initConnectReq = function(req, res) {
  var established;
  req.sendEstablished = function(err, cb) {
    if (established) {
      return;
    }
    if (typeof err === 'function') {
      cb = err;
      err = null;
    }
    established = true;
    var msg = err ? 'Bad Gateway' : 'Connection Established';
    var body = String((err && err.stack) || '');
    var length = Buffer.byteLength(body);
    var resCtn = [
      'HTTP/1.1 ' + (err ? 502 : 200) + ' ' + msg,
      'Content-Length: ' + length,
      'Proxy-Agent: ' + pluginOpts.shortName,
      '\r\n',
      body
    ].join('\r\n');
    res.write(resCtn, function() {
      if (!req._hasError && typeof cb === 'function') {
        setTimeout(cb, 16);
      }
    });
  };
  initWsReq(req, res);
};

var loadModule = function(filepath) {
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

function handleError(socket, sender, receiver) {
  var emitError = function(err) {
    if (socket._emitedError) {
      return;
    }
    socket._emitedError = true;
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

function wrapTunnelWriter(socket) {
  var write = socket.write;
  var end = socket.end;
  var sender = wsParser.getSender(socket);
  handleError(socket, sender);
  socket.write = function(chunk, encoding, cb) {
    if (chunk = toBinary(chunk)) {
      if (encoding === 'binary') {
        return write.call(this, chunk, encoding, cb);
      }
      sender.send(chunk);
    }
  };
  socket.end = function(chunk) {
    socket.write(chunk);
    return end.call(this);
  };
}

function wrapTunnelReader(socket) {
  socket.wsExts = '';
  var receiver = wsParser.getReceiver(socket);
  var emit = socket.emit;
  handleError(socket, null, receiver);
  socket.emit = function(type, chunk) {
    if (type === 'data' && chunk) {
      return receiver.add(chunk);
    }
    return emit.apply(this, arguments);
  };
  receiver.onData = function(chunk) {
    emit.call(socket, 'data', chunk);
  };
}

function addFrameHandler(req, socket, maxWsPayload, fromClient, toServer) {
  socket.wsExts = req.headers['sec-websocket-extensions'] || '';
  var receiver = wsParser.getReceiver(socket, !fromClient, maxWsPayload);
  var emit = socket.emit;
  var write = socket.write;
  var end = socket.end;
  var sender = wsParser.getSender(socket, toServer);
  var getOptions = function(opts) {
    if (typeof opts !== 'object') {
      opts = null; 
    } else if (opts) {
      opts.mask = toServer;
      opts.binary = opts.binary || opts.opcode == 2;
    }
    return opts || (toServer ? MASK_OPTIONS : '');
  };
  handleError(socket, sender, receiver);
  socket.emit = function(type, chunk) {
    if (type === 'data' && chunk) {
      return receiver.add(chunk);
    }
    return emit.apply(this, arguments);
  };
  receiver.onData = function(chunk, opts) {
    emit.call(socket, 'data', chunk, opts);
  };
  socket.write = function(chunk, opts, cb) {
    if (chunk = toBinary(chunk)) {
      if (opts === 'binary') {
        return write.call(this, chunk, opts, cb);
      }
      sender.send(chunk, getOptions(opts));
    }
  };
  socket.end = function(chunk) {
    socket.write(chunk);
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
  Object.keys(req.headers).forEach(function(key) {
    if (!exlucdekyes[key]) {
      headers[key] = req.headers[key];
    }
  });
  return headers;
}

function addErrorHandler(req, client) {
  var done;
  client.on('error', function(err) {
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
  receiver.onclose = function(code, message, opts) {
    sender.close(code, message, opts.masked);
  };
}

module.exports = function(options, callback) {
  options.Storage = Storage;
  options.parseUrl = parseUrl;
  options.formatHeaders = formatRawHeaders;
  var config = options.config;
  var boundIp = config.host;
  var PROXY_ID_HEADER = config.PROXY_ID_HEADER;
  var name = options.name;
  var PLUGIN_HOOKS = options.config.PLUGIN_HOOKS;
  var RES_RULES_HEAD = options.config.RES_RULES_HEAD;
  var getRulesStr = function(obj) {
    obj = JSON.stringify({
      rules: typeof obj === 'string' ? obj : obj.rules,
      values: obj.values,
      root: options.value
    });
    return encodeURIComponent(obj);
  };

  PLUGIN_HOOK_NAME_HEADER = options.config.PLUGIN_HOOK_NAME_HEADER;
  options.shortName = name.substring(name.indexOf('/') + 1);
  storage = new Storage(path.join(options.config.baseDir, '.plugins', options.name));
  options.storage = options.localStorage = storage;
  pluginOpts = options;
  Object.keys(options).forEach(function(key) {
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
  var baseUrl = 'http://' + boundIp + ':' + config.port + '/cgi-bin/';
  sessionOpts = parseUrl(baseUrl + 'get-session?');
  sessionOpts.headers = headers;
  framesOpts = parseUrl(baseUrl + 'get-frames?');
  framesOpts.headers = headers;
  customParserOpts = parseUrl(baseUrl + 'custom-frames?');
  customParserOpts.headers = headers;
  customParserOpts.method = 'POST';
  var normalizeArgs = function (uri, cb, req, curUrl, isWs, opts, alpnProtocol) {
    var type = uri && typeof uri;
    var headers, method;
    if (type !== 'string') {
      if (uri && type === 'object') {
        headers = uri.headers;
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
        uri =  curUrl;
      }
    }
    uri = parseUrl(uri);
    headers = headers || extractHeaders(req, pluginKeyMap);
    if (isWs) {
      headers.upgrade = 'websocket';
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
      uri.port = config.port;
      if (isHttps) {
        headers[config.HTTPS_FIELD] = 1;
        if (alpnProtocol) {
          headers[config.ALPN_PROTOCOL_HEADER] = alpnProtocol;
        }
      }
      isHttps = false;
    } else {
      uri.host = opts.host;
      uri.port = opts.port > 0 ? opts.port : (isHttps ? 443 : 80);
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

  var port, statsPort, resStatsPort, uiPort, rulesPort, resRulesPort, tunnelRulesPort, tunnelPort;
  var reqWritePort, reqReadPort, resWritePort, resReadPort;
  var wsReqWritePort, wsReqReadPort, wsResWritePort, wsResReadPort;
  var tunnelReqWritePort, tunnelReqReadPort, tunnelResWritePort, tunnelResReadPort;
  var callbackHandler = function() {
    callback(null, {
      port: port,
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
  } catch(e) {
    return callbackHandler();
  }
  options.LRU = LRU;
  var cgiHeaders = {};
  cgiHeaders[PROXY_ID_HEADER] = options.shortName.substring(8);
  cgiHeaders['x-whistle-auth-key'] = authKey;
  var parseCgiUrl = function(url) {
    var opts = parseUrl(url);
    opts.headers = cgiHeaders;
    return opts;
  };
  var rulesUrlOpts = parseCgiUrl(baseUrl + 'rules/list2');
  var valuesUrlOpts = parseCgiUrl(baseUrl + 'values/list2');
  var composeOpts = parseCgiUrl(baseUrl + 'composer');
  var certsInfoUrlOpts = parseCgiUrl(baseUrl + 'get-custom-certs-info');
  var enableOpts = parseCgiUrl(baseUrl + 'plugins/is-enable');
  var updateRulesOpts = parseCgiUrl(baseUrl + 'plugins/update-rules');
  var updateTimer;
  composeOpts.method = 'POST';
  composeOpts.headers['Content-Type'] = 'application/json';
  var requestCgi = function(opts, cb) {
    if (typeof cb !== 'function') {
      return;
    }
    request(opts, function(err, body, res) {
      if (body && res.statusCode == 200) {
        try {
          return cb(JSON.parse(body) || '');
        } catch (e) {}
      }
      cb('', res);
    });
  };

  var updateRules = function() {
    requestCgi(updateRulesOpts, noop);
    updateTimer = null;
  };
  options.updateRules = function() {
    updateTimer = updateTimer || setTimeout(updateRules, 500);
  };
  options.composer = options.compose = function(data, cb) {
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
    request(composeOpts, function(err, body, res) {
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
  options.getRules = function(cb) {
    requestCgi(rulesUrlOpts, cb);
  };
  options.getValues = function(cb) {
    requestCgi(valuesUrlOpts, cb);
  };
  var certsInfo;
  options.getCustomCertsInfo = function(cb) {
    if (typeof cb !== 'function') {
      return;
    }
    if (certsInfo) {
      return cb(certsInfo);
    }
    requestCgi(certsInfoUrlOpts, function(data) {
      certsInfo = certsInfo || data;
      cb(certsInfo);
    });
  };
  var enableCallbacks = [];
  options.isEnable = options.isActive = function(cb) {
    if (typeof cb !== 'function') {
      return;
    }
    enableCallbacks.push(cb);
    if (enableCallbacks.length > 1) {
      return;
    }
    var checkEnable = function() {
      requestCgi(enableOpts, function(data, r) {

        if (!data) {
          return setTimeout(checkEnable, 600);
        }
        enableCallbacks.forEach(function(callback) {
          callback(data.enable);
        });
        enableCallbacks = [];
      });
    };
    checkEnable();
  };
  var initServers = function(_ctx) {
    ctx = _ctx || ctx;
    var execPlugin = require(options.value) || '';
    var startServer = getFunction(execPlugin.pluginServer || execPlugin.server || execPlugin);
    var startStatsServer = getFunction(execPlugin.statServer || execPlugin.statsServer
      || execPlugin.reqStatServer || execPlugin.reqStatsServer);
    var startResStatsServer = getFunction(execPlugin.resStatServer || execPlugin.resStatsServer);
    var startUIServer = getFunction(execPlugin.uiServer || execPlugin.innerServer || execPlugin.internalServer);
    var startRulesServer = getFunction(execPlugin.pluginRulesServer || execPlugin.rulesServer || execPlugin.reqRulesServer);
    var startResRulesServer = getFunction(execPlugin.resRulesServer);
    var startTunnelRulesServer = getFunction(execPlugin.pluginRulesServer || execPlugin.tunnelRulesServer);
    var startTunnelServer = getFunction(execPlugin.pluginServer || execPlugin.tunnelServer || execPlugin.connectServer) || startServer;
    var startReqRead = getFunction(execPlugin.reqRead || execPlugin.reqReadServer);
    var startReqWrite = getFunction(execPlugin.reqWrite || execPlugin.reqWriteServer);
    var startResRead = getFunction(execPlugin.resRead || execPlugin.resReadServer);
    var startResWrite = getFunction(execPlugin.resWrite || execPlugin.resWriteServer);
    var startWsReqRead = getFunction(execPlugin.wsReqRead || execPlugin.wsReqReadServer);
    var startWsReqWrite = getFunction(execPlugin.wsReqWrite || execPlugin.wsReqWriteServer);
    var startWsResRead = getFunction(execPlugin.wsResRead || execPlugin.wsResReadServer);
    var startWsResWrite = getFunction(execPlugin.wsResWrite || execPlugin.wsResWriteServer);
    var startTunnelReqRead = getFunction(execPlugin.tunnelReqRead || execPlugin.tunnelReqReadServer);
    var startTunnelReqWrite = getFunction(execPlugin.tunnelReqWrite || execPlugin.tunnelReqWriteServer);
    var startTunnelResRead = getFunction(execPlugin.tunnelResRead || execPlugin.tunnelResReadServer);
    var startTunnelResWrite = getFunction(execPlugin.tunnelResWrite || execPlugin.tunnelResWriteServer);
    var hasServer = startServer || startStatsServer || startResStatsServer || startUIServer || startRulesServer
      || startResRulesServer || startTunnelRulesServer || startTunnelServer || startReqRead || startReqWrite
      || startResRead || startResWrite || startWsReqRead || startWsReqWrite || startWsResRead || startWsResWrite
      || startTunnelReqRead || startTunnelReqWrite || startTunnelResRead || startTunnelResWrite;
    
    if (!hasServer) {
      return callbackHandler();
    }

    getServer(function(server, _port) {
      var maxWsPayload;
      var uiServer, httpServer, statsServer, resStatsServer;
      var rulesServer, resRulesServer, tunnelRulesServer, tunnelServer;
      var reqRead, reqWrite, resWrite, resRead;
      var wsReqRead, wsReqWrite, wsResWrite, wsResRead;
      var tunnelReqRead, tunnelReqWrite, tunnelResWrite, tunnelResRead;
      var setMaxWsPayload = function(payload) {
        maxWsPayload = parseInt(payload, 10) || 0;
      };

      if (startUIServer) {
        uiServer = createServer();
        startUIServer(uiServer, options);
        uiPort = _port;
      }

      if (startServer) {
        httpServer = createServer();
        startServer(httpServer, options);
        port = _port;
      }

      if (startStatsServer) {
        statsServer = createServer();
        startStatsServer(statsServer, options);
        statsPort = _port;
      }

      if (startResStatsServer) {
        resStatsServer = createServer();
        startResStatsServer(resStatsServer, options);
        resStatsPort = _port;
      }

      if (startRulesServer) {
        rulesServer = createServer();
        startRulesServer(rulesServer, options);
        rulesPort = _port;
      }

      if (startResRulesServer) {
        resRulesServer = createServer();
        startResRulesServer(resRulesServer, options);
        resRulesPort = _port;
      }
  
      if (startTunnelRulesServer) {
        tunnelRulesServer = createServer();
        startTunnelRulesServer(tunnelRulesServer, options);
        tunnelRulesPort = _port;
      }

      if (startTunnelServer) {
        tunnelServer = createServer();
        startTunnelServer(tunnelServer, options);
        tunnelPort = _port;
      }

      if (startReqRead) {
        reqRead = createServer();
        startReqRead(reqRead, options);
        reqReadPort = _port;
      }

      if (startReqWrite) {
        reqWrite = createServer();
        startReqWrite(reqWrite, options);
        reqWritePort = _port;
      }

      if (startResRead) {
        resRead = createServer();
        startResRead(resRead, options);
        resReadPort = _port;
      }

      if (startResWrite) {
        resWrite = createServer();
        startResWrite(resWrite, options);
        resWritePort = _port;
      }

      if (startWsReqRead) {
        wsReqRead = createServer();
        wsReqRead.setMaxWsPayload = setMaxWsPayload;
        startWsReqRead(wsReqRead, options);
        wsReqReadPort = _port;
      }

      if (startWsReqWrite) {
        wsReqWrite = createServer();
        wsReqWrite.setMaxWsPayload = setMaxWsPayload;
        startWsReqWrite(wsReqWrite, options);
        wsReqWritePort = _port;
      }

      if (startWsResRead) {
        wsResRead = createServer();
        wsResRead.setMaxWsPayload = setMaxWsPayload;
        startWsResRead(wsResRead, options);
        wsResReadPort = _port;
      }

      if (startWsResWrite) {
        wsResWrite = createServer();
        wsResWrite.setMaxWsPayload = setMaxWsPayload;
        startWsResWrite(wsResWrite, options);
        wsResWritePort = _port;
      }

      if (startTunnelReqRead) {
        tunnelReqRead = createServer();
        startTunnelReqRead(tunnelReqRead, options);
        tunnelReqReadPort = _port;
      }

      if (startTunnelReqWrite) {
        tunnelReqWrite = createServer();
        startTunnelReqWrite(tunnelReqWrite, options);
        tunnelReqWritePort = _port;
      }

      if (startTunnelResRead) {
        tunnelResRead = createServer();
        startTunnelResRead(tunnelResRead, options);
        tunnelResReadPort = _port;
      }

      if (startTunnelResWrite) {
        tunnelResWrite = createServer();
        startTunnelResWrite(tunnelResWrite, options);
        tunnelResWritePort = _port;
      }
      server.timeout = config.timeout;
      server.on('request', function(req, res) {
        switch(getHookName(req)) {
        case PLUGIN_HOOKS.UI:
          if (uiServer) {
            setContext(req);
            uiServer.emit('request', req, res);
          }
          break;
        case PLUGIN_HOOKS.HTTP:
          if (httpServer) {
            initReq(req, res);
            var alpnProtocol = req.headers[config.ALPN_PROTOCOL_HEADER];
            var curUrl = req.originalReq.realUrl;
            var svrRes = '';
            var resRules;
            var writeHead = res.writeHead;
            req.setResRules = res.setResRules = function(rules) {
              resRules = rules;
            };
            req.writeHead = res.writeHead = function(code, msg, headers) {
              code = code > 0 ? code : (svrRes.statusCode || 101);
              if (msg && typeof msg !== 'string') {
                headers = headers || msg;
                msg = null;
              }
              msg = msg || STATUS_CODES[code] || '';
              headers = headers || svrRes.headers;
              if (resRules) {
                headers = headers || {};
                headers[RES_RULES_HEAD] = getRulesStr(resRules);
              }
              headers = formatRawHeaders(headers, svrRes);
              writeHead.call(res, code, msg, headers);
              res.emit('_wroteHead');
            };
            req.request = function(uri, cb, opts) {
              var args = normalizeArgs(uri, cb, req, curUrl, false, opts, alpnProtocol);
              uri = args[0];
              cb = args[1];
              uri.agent = false;
              var client = (args[2] ? httpsRequest : httpRequest)(uri, function(_res) {
                svrRes = _res;
                res.once('_wroteHead', function() {
                  appendTrailers(_res, res, args[3] && args[3].trailers, req);
                });
                if (typeof cb === 'function') {
                  cb.call(this, _res);
                } else {
                  res.writeHead();
                  _res.pipe(res);
                }
              });
              addErrorHandler(req, client);
              return client;
            };
            req.passThrough = function(uri, newTrailers) {
              var client = req.request(uri, function(_res) {
                res.writeHead(_res.statusCode, _res.statusMessage, _res.headers);
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
      server.on('upgrade', function(req, socket, head) {
        switch(getHookName(req)) {
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
            var resRules;
            req.setResRules = socket.setResRules = function(rules) {
              resRules = rules;
            };
            req.writeHead = socket.writeHead = function(code, msg, headers) {
              code = code > 0 ? code : (svrRes.statusCode || 101);
              if (msg && typeof msg !== 'string') {
                headers = headers || msg;
                msg = null;
              }
              headers = headers || svrRes.headers;
              if (resRules) {
                headers = headers || {};
                headers[RES_RULES_HEAD] = getRulesStr(resRules);
              }
              headers = [
                'HTTP/1.1 ' + code + ' ' + (msg || svrRes.statusMessage || STATUS_CODES[code] || ''),
                headers ? getRawHeaders(formatRawHeaders(headers, svrRes)) : '',
                '\r\n'
              ];
              socket.write(headers.join('\r\n'), 'binary');
            };
            req.request = function(uri, cb, opts) {
              var args = normalizeArgs(uri, cb, req, curUrl, true, opts);
              uri = args[0];
              cb = args[1];
              opts = args[3];
              uri.agent = false;
              var client = (args[2] ? httpsRequest : httpRequest)(uri);
              var rawFrame;
              if (opts === true) {
                rawFrame = true;
              } else if (opts) {
                rawFrame = opts.rawFrame;
              }
              client.on('upgrade', function(_res, resSocket) {
                svrRes = _res;
                if (rawFrame !== true) {
                  var clientParser = addFrameHandler(_res, socket, maxWsPayload, true, false);
                  var serverParser = addFrameHandler(_res, resSocket, maxWsPayload, false, true);
                  handleWsSignal(clientParser.receiver, serverParser.sender);
                  handleWsSignal(serverParser.receiver, clientParser.sender);
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
              return client.end();
            };
            req.passThrough = function(uri) {
              req.request(uri, function(resSock) {
                socket.writeHead(resSock.statusCode, resSock.statusMessage, resSock.headers);
                resSock.pipe(socket).pipe(resSock);
              }, true);
            };
            httpServer.emit('upgrade', req, socket, head);
          }
          break;
        default:
          socket.destroy();
        }
      });

      var emitHttpPipe = function(httpServer, req, socket) {
        if (httpServer) {
          initConnectReq(req, socket);
          req.sendEstablished(function() {
            var decoder = getDecodeTransform();
            var encoder = getEncodeTransform();
            var done;
            var handleError = function(err) {
              if (!done) {
                done = true;
                socket.emit('error', err || new Error('destroyed'));
              }
            };
            socket.on('error', function(err) {
              if (!done) {
                done = true;
                decoder.emit('error', err);
                encoder.emit('error', err);
              }
            });
            encoder.once('finish', function() {
              done = true;
            });
            socket.on('close', function() {
              done = true;
              decoder.emit('close');
              encoder.emit('close');
            });
            decoder.destroy = encoder.destroy = handleError;
            decoder.on('error', handleError);
            encoder.on('error', handleError);
            ADDITIONAL_FIELDS.forEach(function(key) {
              decoder[key] = req[key];
            });
            socket.pipe(decoder);
            encoder.pipe(socket);
            httpServer.emit('request', decoder, encoder);
          });
        }
      };

      server.on('connect', function(req, socket, head) {
        switch(getHookName(req)) {
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
          if (wsReqRead) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              addFrameHandler(req, socket, maxWsPayload, true, true);
              wsReqRead.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.WS_REQ_WRITE:
          if (wsReqWrite) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              addFrameHandler(req, socket, maxWsPayload, true, true);
              wsReqWrite.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.WS_RES_READ:
          if (wsResRead) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              addFrameHandler(req, socket, maxWsPayload);
              wsResRead.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.WS_RES_WRITE:
          if (wsResWrite) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              addFrameHandler(req, socket, maxWsPayload);
              wsResWrite.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL:
          if (tunnelServer) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              req.connect = function(cb, opts) {
                var headers = extractHeaders(req, pluginKeyMap);
                var policy = headers['x-whistle-policy'];
                if (policy) {
                  headers['x-whistle-policy'] = policy;
                }
                var uri = {
                  method: 'CONNECT',
                  agent: false,
                  path: headers.host
                };
                if (cb && typeof cb !== 'function') {
                  opts = cb;
                  cb = null;
                }
                if (!opts || !notEmptyStr(opts.host)) {
                  headers[PROXY_ID_HEADER] = req[REQ_ID_KEY];
                  uri.host = boundIp;
                  uri.port = config.port;
                } else {
                  uri.host = opts.host;
                  uri.port = opts.port > 0 ? opts.port : 80;
                }
                uri.headers = formatRawHeaders(headers, req);
                var client = httpRequest(uri);
                client.on('connect', function(_res, svrSock) {
                  if (_res.statusCode !== 200) {
                    var err = new Error('Tunneling socket could not be established, statusCode=' + _res.statusCode);
                    err.statusCode = _res.statusCode;
                    svrSock.destroy();
                    process.nextTick(function() {
                      client.emit('error', err);
                    });
                    return;
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
                return client.end();
              };
              req.passThrough = function() {
                req.connect(function(svrSock) {
                  svrSock.pipe(socket).pipe(svrSock);
                });
              };
              tunnelServer.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_REQ_READ:
          if (tunnelReqRead) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              socket.headers = req.headers;
              tunnelReqWrite && wrapTunnelWriter(socket);
              tunnelReqRead.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_REQ_WRITE:
          if (tunnelReqWrite) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              tunnelReqRead && wrapTunnelReader(socket);
              tunnelReqWrite.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_RES_READ:
          if (tunnelResRead) {
            initConnectReq(req, socket);
            req.sendEstablished(function() {
              socket.headers = req.headers;
              tunnelResWrite && wrapTunnelWriter(socket);
              tunnelResRead.emit('connect', req, socket, head);
            });
          }
          break;
        case PLUGIN_HOOKS.TUNNEL_RES_WRITE:
          if (tunnelResWrite) {
            initConnectReq(req, socket);
            tunnelResRead && wrapTunnelReader(socket);
            req.sendEstablished(function() {
              tunnelResWrite.emit('connect', req, socket, head);
            });
          }
          break;
        default:
          socket.destroy();
        }
      });
      callbackHandler();
    });
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


