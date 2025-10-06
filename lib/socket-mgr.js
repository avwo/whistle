var pluginMgr = require('./plugins');
var wsParser = require('ws-parser');
var util = require('./util');
var Buffer = require('safe-buffer').Buffer;
var rules = require('./rules');
var extend = require('extend');

var pendingReqList = [];
var INTERVAL = 22 * 1000;
var proxy;
var index = 0;
var MAX_PAYLOAD = 1024 * 1024;
var conns = {};
var PING = Buffer.from('iQA=', 'base64');
var PONG = Buffer.from('ioAn6ubf', 'base64');
var PAUSE_STATUS = 1;
var IGNORE_STATUS = 2;
var MAX_COMPOSE_FRAME_COUNT = 5;

function getFrameId() {
  ++index;
  if (index > 999) {
    index = 0;
  }
  if (index > 99) {
    return Date.now() + '-' + index;
  }
  if (index > 9) {
    return Date.now() + '-0' + index;
  }
  return Date.now() + '-00' + index;
}

exports = module.exports = function (p) {
  proxy = p;
};

function handleSocketEnd(req, res, callback) {
  util.onSocketEnd(req, callback);
  util.onSocketEnd(res, callback);
}

function handleClose(req, res, justTunnel) {
  handleSocketEnd(req, res, function (err) {
    var ctx = conns[req.reqId];
    ctx && ctx.clearup();
    var closed = req._hasClosed;
    req._hasClosed = true;
    // 确保两个连接都关掉才行
    if (closed) {
      req.emit('_closed');
    }
    if (req.customParser) {
      !closed && removePending(req.reqId);
      return;
    }
    if (closed && !justTunnel) {
      req._emittedClosed = true;
      proxy.emit('frame', {
        reqId: req.reqId,
        frameId: getFrameId(),
        closed: true,
        code: req._errorCode || res._errorCode,
        err: err && err.message
      });
    }
  });
}

function getStatus(ctx, status, name) {
  status = parseInt(status, 10);
  name = name || 'receiveStatus';
  var oldStatus = ctx[name] || 0;
  status = ctx[name] = status > 0 || status < 3 ? status : 0;
  return status !== oldStatus ? status : -1;
}

function setConnStatus(ctx, status, statusObj, name) {
  statusObj.pause = statusObj.ignore = undefined;
  status = getStatus(ctx, status, name);
  if (status === 1) {
    statusObj.pause = true;
    return;
  }
  if (status === 2) {
    statusObj.ignore = true;
    statusObj.chunk = null;
    statusObj.ignoring = !!statusObj.callback;
  }
  statusObj.emitData && statusObj.emitData();
  if (statusObj.callback) {
    statusObj.addToReceiver && statusObj.addToReceiver();
    statusObj.callback(null, statusObj.chunk);
    statusObj.addToReceiver = null;
    statusObj.callback = null;
    statusObj.chunk = null;
  }
}

function initStatus(ctx, enable) {
  if (enable.pauseSend) {
    ctx.setSendStatus(PAUSE_STATUS);
  } else if (enable.ignoreSend) {
    ctx.setSendStatus(IGNORE_STATUS);
  }
  if (enable.pauseReceive) {
    ctx.setReceiveStatus(PAUSE_STATUS);
  } else if (enable.ignoreReceive) {
    ctx.setReceiveStatus(IGNORE_STATUS);
  }
}

function removePending(reqId) {
  var index = pendingReqList.indexOf(reqId);
  if (index !== -1) {
    pendingReqList.splice(index, 1);
  }
}

function pipeStream(src, target, useSrc) {
  if (!src || !target) {
    return src || target;
  }
  src.pipe(target);
  return useSrc ? src : target;
}

function emitDataToProxy(req, chunk, fromClient, ignore) {
  if (req.hideFrame || req._emittedClosed) {
    return;
  }
  proxy.emit('frame', {
    reqId: req.reqId,
    frameId: getFrameId(),
    isClient: fromClient,
    length: chunk.length,
    ignore: ignore,
    bin: chunk
  });
}

function handleConnSend(ctx, reqTrans, sendStatus, frameCtx, eventName) {
  var req = ctx.req;
  var res = ctx.res;
  var hasEvent = ctx.hasEvent;
  var writer = res.pipeWriter || res;
  var url = ctx.url;
  ctx.sendToServer = function (data, opts) {
    data = execHandleFrame(frameCtx, data, opts, true);
    if (!data) {
      return false;
    }
    writer.write(data);
    emitDataToProxy(req, data, true);
  };
  sendStatus.emitData = function () {
    if (sendStatus.chunk) {
      emitDataToProxy(req, sendStatus.chunk, true, sendStatus.ignore);
      sendStatus.chunk = null;
    }
  };
  reqTrans._transform = function (chunk, _, cb) {
    hasEvent && proxy.emit(eventName, url);
    if (sendStatus.pause) {
      sendStatus.chunk = chunk;
      sendStatus.callback = cb;
      return;
    }
    chunk = execHandleFrame(frameCtx, chunk, {}, true);
    if (chunk) {
      emitDataToProxy(req, chunk, true, sendStatus.ignore);
      if (sendStatus.ignore) {
        chunk = null;
      }
    }
    cb(null, chunk || null);
  };
}

function handleConnReceive(ctx, resTrans, receiveStatus, frameCtx, eventName) {
  var req = ctx.req;
  var hasEvent = ctx.hasEvent;
  var url = ctx.url;
  var writer = req.pipeWriter || req;
  ctx.sendToClient = function (data, opts) {
    data = execHandleFrame(frameCtx, data, opts);
    if (!data) {
      return false;
    }
    writer.write(data);
    emitDataToProxy(req, data);
  };
  receiveStatus.emitData = function () {
    if (receiveStatus.chunk) {
      emitDataToProxy(
        req,
        receiveStatus.chunk,
        undefined,
        receiveStatus.ignore
      );
      receiveStatus.chunk = null;
    }
  };

  resTrans._transform = function (chunk, _, cb) {
    hasEvent && proxy.emit(eventName, url);
    if (receiveStatus.pause) {
      receiveStatus.chunk = chunk;
      receiveStatus.callback = cb;
      return;
    }
    chunk = execHandleFrame(frameCtx, chunk, {});
    if (chunk) {
      emitDataToProxy(req, chunk, undefined, receiveStatus.ignore);
      if (receiveStatus.ignore) {
        chunk = null;
      }
    }
    cb(null, chunk || null);
  };
}

function clearupStatus(conns, reqId, sendStatus, receiveStatus) {
  delete conns[reqId];
  sendStatus.callback = null;
  receiveStatus.callback = null;
  sendStatus.addToReceiver = null;
  receiveStatus.addToReceiver = null;
  clearInterval(sendStatus.timer);
  clearInterval(receiveStatus.timer);
}

function getBinary(data, len) {
  return len > MAX_PAYLOAD ? data.slice(0, MAX_PAYLOAD) : data;
}

function drainData(status, receiver) {
  status.data.forEach(function (item) {
    status.sender.send(item.data, item);
    receiver.onData(item.data, item, true);
  });
  status.data = [];
  receiver.ping();
}

function handleFrame(receiver, socket, status, chunk, cb, toServer) {
  if (!receiver.existsCacheData) {
    status.ignoring = status.ignore;
    if (status.pause) {
      status.callback = cb;
      status.chunk = chunk;
      status.addToReceiver = function () {
        receiver.add(chunk);
      };
      drainData(status, receiver);
      return;
    }
    if (status.ignore) {
      drainData(status, receiver);
    }
  }
  var toRead = receiver.add(chunk);
  if (status.ignoring) {
    if (!status.ignore && toRead >= 0) {
      status.ignoring = false;
      socket.write(chunk.slice(toRead));
    }
    chunk = null;
  } else if (
    toRead >= 0 &&
    (status.pause || status.ignore || status.data.length)
  ) {
    if (toRead) {
      var readAll = toRead === chunk.length;
      status.chunk = readAll ? null : chunk.slice(toRead);
      socket.write(readAll ? chunk : chunk.slice(0, toRead));
    } else {
      status.chunk = chunk;
    }
    if (status.pause) {
      status.callback = cb;
      drainData(status, receiver);
      return;
    }
    if (status.ignore) {
      status.ignoring = true;
      chunk = null;
      drainData(status, receiver);
    }
  }
  if (chunk && status.timer) {
    clearInterval(status.timer);
    status.timer = null;
  }
  cb(null, chunk);
}

function clearTimer(status) {
  if (!status.ignore && !status.pause) {
    clearInterval(status.timer);
    status.timer = null;
  }
}

function getReceiver(ctx, fromServer) {
  try {
    return wsParser.getReceiver(ctx.res, fromServer, undefined, ctx.noDecompress);
  } catch (e) { }
}

function getSender(socket, toServer) {
  try {
    return wsParser.getSender(socket, toServer);
  } catch (e) { }
}

function execHandleFrame(frameCtx, data, opts, toServer) {
  if (!frameCtx || !data) {
    return data;
  }
  var name = toServer ? 'handleSendToServerFrame' : 'handleSendToClientFrame';
  var filter = frameCtx[name];
  if (typeof filter !== 'function') {
    return data;
  }
  try {
    opts = opts || {};
    data = filter(data, opts);
    if (data) {
      data = util.toBuffer(data, opts.charset);
      opts.length = data.length;
    }
    return data;
  } catch (e) {
    return Buffer.from(((e && e.message) || 'Error: unknown') + ' (' + name + ')');
  }
}

function handleWsSend(ctx, reqTrans, sendStatus, handleTransform, frameCtx, eventName) {
  var res = ctx.res;
  var reqReceiver = getReceiver(ctx, false);
  var hasFilter = frameCtx && typeof frameCtx.handleSendToServerFrame === 'function';
  var hideFrame = ctx.hideFrame;
  var reqSender = getSender(hasFilter ? reqTrans : res.pipeWriter || res, true);
  if (!reqReceiver || !reqSender || (hideFrame && !hasFilter)) {
    reqTrans._transform = handleTransform;
    return;
  }
  var req = ctx.req;
  var url = ctx.url;
  var curEvent = eventName || 'wsRequest';
  var hasEvent = ctx.hasEvent;
  var reqId = req.reqId;

  sendStatus.sender = reqSender;
  util.onSocketEnd(res, function() {
    reqReceiver.flush(function() {
      reqReceiver.cleanup();
    });
  });
  ctx.sendToServer = function (data, opts) {
    if (sendStatus.data.length > MAX_COMPOSE_FRAME_COUNT) {
      return false;
    }
    data = execHandleFrame(frameCtx, data, opts, true);
    if (!data) {
      return false;
    }
    opts.data = data;
    sendStatus.data.push(opts);
    if (
      sendStatus.ignoring ||
      sendStatus.callback ||
      !reqReceiver.existsCacheData
    ) {
      drainData(sendStatus, reqReceiver);
    }
  };
  reqReceiver.ping = function () {
    if (eventName || sendStatus.timer || req.disable.pong) {
      return;
    }
    res.write(PONG);
    sendStatus.timer = setInterval(function () {
      res.write(PONG);
      clearTimer(sendStatus);
    }, INTERVAL);
  };
  reqReceiver.onclose = function (code) {
    ctx.req._errorCode = code;
  };
  reqReceiver.onData = function (data, opts, drain) {
    if (drain !== true && hasFilter) {
      data = execHandleFrame(frameCtx, data, opts);
      if (!data) {
        return;
      }
      reqSender.send(data, opts);
    }
    if (hideFrame) {
      return;
    }
    var opcode = opts.opcode;
    if (!opcode) {
      opcode = opts.binary ? 2 : 1;
    }
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      isClient: true,
      mask: eventName ? undefined : opts.mask,
      ignore: opts.data ? undefined : sendStatus.ignoring,
      bin: getBinary(data, opts.length),
      compressed: eventName ? undefined : opts.compressed,
      notDecompressed: opts.notDecompressed,
      length: opts.length,
      unzipLen: data && opts.compressed ? data.length : undefined,
      opcode: eventName ? undefined : opcode
    });
  };
  reqReceiver.onerror = function (err) {
    if (hideFrame || req._emittedClosed) {
      return;
    }
    req._emittedClosed = true;
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      isClient: true,
      err: err.message,
      bin: ''
    });
  };
  if (hasFilter) {
    var emitData = reqTrans.emit;
    var write = reqTrans.write;
    reqTrans.write = function (chunk, opts, cb) {
      if ((chunk = util.toBuffer(chunk))) {
        if (opts === 'binary') {
          emitData.call(this, 'data', chunk, opts);
          return;
        }
        return write.call(this, chunk, opts, cb);
      }
    };
    reqTrans.emit = function (type, chunk) {
      if (type === 'data' && chunk) {
        return reqReceiver.add(chunk);
      }
      return emitData.apply(this, arguments);
    };
    return;
  }
  reqTrans._transform = function (chunk, _, cb) {
    hasEvent && proxy.emit(curEvent, url);
    handleFrame(reqReceiver, res, sendStatus, chunk, cb, true);
  };
}

function handleWsReceive(ctx, resTrans, receiveStatus, handleTransform, frameCtx, eventName) {
  var req = ctx.req;
  var resReceiver = getReceiver(ctx, true);
  var hasFilter = frameCtx && typeof frameCtx.handleSendToClientFrame === 'function';
  var hideFrame = ctx.hideFrame;
  var resSender = getSender(hasFilter ? resTrans : req.pipeWriter || req);
  if (!resReceiver || !resSender || (hideFrame && !hasFilter)) {
    resTrans._transform = handleTransform;
    return;
  }
  var url = ctx.url;
  var curEvent = eventName || 'wsRequest';
  var hasEvent = ctx.hasEvent;
  var reqId = req.reqId;
  receiveStatus.sender = resSender;
  util.onSocketEnd(req, function() {
    resReceiver.flush(function() {
      resReceiver.cleanup();
    });
  });
  ctx.sendToClient = function (data, opts) {
    if (receiveStatus.data.length > MAX_COMPOSE_FRAME_COUNT) {
      return false;
    }
    data = execHandleFrame(frameCtx, data, opts);
    if (!data) {
      return false;
    }
    opts.data = data;
    receiveStatus.data.push(opts);
    if (
      receiveStatus.ignoring ||
      receiveStatus.callback ||
      !resReceiver.existsCacheData
    ) {
      drainData(receiveStatus, resReceiver);
    }
  };
  resReceiver.ping = function () {
    if (eventName || receiveStatus.timer || req.disable.ping) {
      return;
    }
    req.write(PING);
    receiveStatus.timer = setInterval(function () {
      req.write(PING);
      clearTimer(receiveStatus);
    }, INTERVAL);
  };
  resReceiver.onclose = function (code) {
    ctx.res._errorCode = code;
  };
  resReceiver.onData = function (data, opts, drain) {
    if (drain !== true && hasFilter) {
      data = execHandleFrame(frameCtx, data, opts);
      if (!data) {
        return;
      }
      resSender.send(data, opts);
    }
    if (hideFrame) {
      return;
    }
    var opcode = opts.opcode;
    if (!opcode) {
      opcode = opts.binary ? 2 : 1;
    }
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      bin: getBinary(data, opts.length),
      mask: eventName ? undefined : opts.mask,
      ignore: opts.data ? undefined : receiveStatus.ignoring,
      compressed: eventName ? undefined : opts.compressed,
      notDecompressed: opts.notDecompressed,
      length: opts.length,
      unzipLen: data && opts.compressed ? data.length : undefined,
      opcode: eventName ? undefined : opcode
    });
  };
  resReceiver.onerror = function (err) {
    if (hideFrame || req._emittedClosed) {
      return;
    }
    req._emittedClosed = true;
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      err: err.message,
      bin: ''
    });
  };
  if (hasFilter) {
    var emitData = resTrans.emit;
    var write = resTrans.write;
    resTrans.write = function (chunk, opts, cb) {
      if ((chunk = util.toBuffer(chunk))) {
        if (opts === 'binary') {
          emitData.call(this, 'data', chunk, opts);
          return;
        }
        return write.call(this, chunk, opts, cb);
      }
    };
    resTrans.emit = function (type, chunk) {
      if (type === 'data' && chunk) {
        return resReceiver.add(chunk);
      }
      return emitData.apply(this, arguments);
    };
    return;
  }
  resTrans._transform = function (chunk, _, cb) {
    hasEvent && proxy.emit(curEvent, url);
    handleFrame(resReceiver, req, receiveStatus, chunk, cb);
  };
}

function getContext(req, res, hasEvent, sendStatus, receiveStatus, noDecompress) {
  var reqId = req.reqId;
  var ctx = (conns[reqId] = {
    customParser: req.customParser,
    req: req,
    res: res,
    hasEvent: hasEvent,
    url: req.fullUrl,
    noDecompress: noDecompress,
    charset: util.getCharset(res.headers['content-type']) || '',
    clearup: function () {
      clearupStatus(conns, reqId, sendStatus, receiveStatus);
    },
    setSendStatus: function (status) {
      setConnStatus(ctx, status, sendStatus, 'sendStatus');
    },
    setReceiveStatus: function (status) {
      setConnStatus(ctx, status, receiveStatus);
    }
  });
  initStatus(ctx, req.enable);
  return ctx;
}

exports.setContext = getContext;

exports.removeContext = function (req) {
  delete conns[req.reqId];
};

function cacheFrames(frames, data) {
  if (frames.length < MAX_COMPOSE_FRAME_COUNT) {
    frames.push(data);
  }
  return frames;
}

function setFrameScript(opts, data, toServer) {
  opts = opts ? extend({}, opts) : {};
  opts.frameScript = true;
  opts.length = data.length;
  if (toServer) {
    opts.mask = true;
  }
  return opts;
}

function formatFrameScriptArgs(data, opts, toServer) {
  data = util.toBuffer(data, opts && opts.charset);
  return data && [data, setFrameScript(opts, data, toServer)];
}

function getFrameSender(options, toServer) {
  return function (data, opts) {
    var ctx = options.ctx;
    if (ctx === false) {
      return;
    }
    var args = formatFrameScriptArgs(data, opts, toServer);
    if (!args) {
      return;
    }
    if (!ctx) {
      var key = toServer ? 'clientFrames' : 'serverFrames';
      options[key] = cacheFrames(options[key] || [], args);
      return;
    }
    var name = toServer ? 'sendToServer' : 'sendToClient';
    ctx[name] && ctx[name](args[0], args[1]);
  };
}

function getFrameCtx(options, callback) {
  var req = options.req;
  rules.getFrameScriptCtx(req.rules.frameScript, req, options.res, {
    sendToClient: getFrameSender(options),
    sendToServer: getFrameSender(options, true)
  }, callback);
}

function cleanCacheFrames(ctx, options) {
  var clientFrames = options.clientFrames;
  var serverFrames = options.serverFrames;
  if (clientFrames && ctx.sendToServer) {
    clientFrames.forEach(function (item) {
      ctx.sendToServer(item[0], item[1]);
    });
    options.clientFrames = null;
  }
  if (serverFrames && ctx.sendToClient) {
    serverFrames.forEach(function (item) {
      ctx.sendToClient(item[0], item[1]);
    });
    options.serverFrames = null;
  }
}

exports.handleUpgrade = function (req, res) {
  var hide = util.isHide(req);
  var customParser = req.customParser;
  var hideFrame = hide || customParser;
  handleClose(req, res, hideFrame || req.isPluginReq);
  if (req.isPluginReq) {
    return req.pipe(res).pipe(req);
  }
  var url = req.fullUrl;
  var reqId = req.reqId;
  var sendStatus = { data: [] };
  var receiveStatus = { data: [] };
  var emitError = function (err) {
    req.emit('error', err);
  };
  var reqTrans = util.createTransform();
  var resTrans = util.createTransform();
  var noDecompress = util.isDisable(req, 'wsDecompress');

  req._noDecompress = noDecompress;
  reqTrans.on('error', emitError);
  resTrans.on('error', emitError);
  res.headers = res.headers || {};
  req.wsExts = res.headers['sec-websocket-extensions'] || '';
  var options = { req: req, res: res };
  pluginMgr.getWsPipe(
    req,
    res,
    function (reqRead, reqWrite, resRead, resWrite) {
      customParser && removePending(reqId);
      getFrameCtx(options, function(frameCtx) {
        if (req._hasClosed) {
          return;
        }
        var hasEvent = util.listenerCount(proxy, 'wsRequest');
        var handleTransform = function (chunk, _, cb) {
          hasEvent && proxy.emit('wsRequest', url);
          cb(null, chunk);
        };
        if (hideFrame && !frameCtx) {
          reqTrans._transform = resTrans._transform = handleTransform;
          options.ctx = false;
        } else {
          reqTrans.headers = resTrans.headers = res.headers;
          if (reqWrite) {
            reqWrite.headers = res.headers;
            res.pipeWriter = reqWrite;
          }
          if (resWrite) {
            resWrite.headers = res.headers;
            req.pipeWriter = resWrite;
          }
          var ctx = options.ctx = (conns[reqId] = getContext(
            req,
            res,
            hasEvent,
            sendStatus,
            receiveStatus,
            noDecompress
          ));
          ctx.hideFrame = req.hideFrame = hideFrame;
          handleWsSend(ctx, reqTrans, sendStatus, handleTransform, frameCtx);
          handleWsReceive(ctx, resTrans, receiveStatus, handleTransform, frameCtx);
          cleanCacheFrames(ctx, options);
        }
        pipeStream(req, reqRead)
        .pipe(reqTrans)
        .pipe(pipeStream(reqWrite, res, true));
        pipeStream(res, resRead)
        .pipe(resTrans)
        .pipe(pipeStream(resWrite, req, true));
      });
    }
  );
};

exports.handleConnect = function (req, res, isUpgrade) {
  var eventName = isUpgrade ? 'wsRequest' : 'tunnelRequest';
  var hasEvent = util.listenerCount(proxy, eventName);
  var isConn = isUpgrade || req.inspectFrames;
  var customParser = req.customParser;
  var hide = util.isHide(req);
  var hideFrame = customParser || hide;
  handleClose(req, res, hideFrame || req.isPluginReq || !isConn);
  if (req.isPluginReq || (!isConn && !hasEvent)) {
    return req.pipe(res).pipe(req);
  }
  var url = req.fullUrl;
  var reqTrans = util.createTransform();
  var resTrans = util.createTransform();
  var handleTransform = function (chunk, _, cb) {
    hasEvent && proxy.emit(eventName, url);
    cb(null, chunk);
  };
  var emitError = function (err) {
    req.emit('error', err);
  };
  reqTrans.on('error', emitError);
  resTrans.on('error', emitError);

  if (!isConn) {
    reqTrans._transform = resTrans._transform = handleTransform;
    return req.pipe(reqTrans).pipe(res).pipe(resTrans).pipe(req);
  }
  var reqId = req.reqId;
  var sendStatus = { data: [] };
  var receiveStatus = { data: [] };
  res.headers = res.headers || req.headers;
  req._isUpgrade = isUpgrade;
  var options = { req: req, res: res };
  pluginMgr.getTunnelPipe(
    req,
    res,
    function (reqRead, reqWrite, resRead, resWrite) {
      customParser && removePending(reqId);
      getFrameCtx(options, function(frameCtx) {
        if (req._hasClosed) {
          return;
        }
        if (hideFrame && !frameCtx) {
          reqTrans._transform = resTrans._transform = handleTransform;
          options.ctx = false;
        } else {
          req.wsExts = res.wsExts = reqTrans.wsExts = resTrans.wsExts = '';
          if (reqWrite) {
            reqWrite.wsExts = '';
            res.pipeWriter = reqWrite;
          }
          if (resWrite) {
            resWrite.wsExts = '';
            req.pipeWriter = resWrite;
          }
          var ctx = options.ctx = getContext(req, res, hasEvent, sendStatus, receiveStatus);
          ctx.hideFrame = req.hideFrame = hideFrame;
          if (reqRead && reqWrite) {
            handleWsSend(ctx, reqTrans, sendStatus, handleTransform, frameCtx, eventName);
          } else {
            handleConnSend(ctx, reqTrans, sendStatus, frameCtx, eventName);
          }
          if (resRead && resWrite) {
            handleWsReceive(ctx, resTrans, receiveStatus, handleTransform, frameCtx, eventName);
          } else {
            handleConnReceive(ctx, resTrans, receiveStatus, frameCtx, eventName);
          }
          cleanCacheFrames(ctx, options);
        }

        pipeStream(req, reqRead)
        .pipe(reqTrans)
        .pipe(pipeStream(reqWrite, res, true));
        pipeStream(res, resRead)
        .pipe(resTrans)
        .pipe(pipeStream(resWrite, req, true));
      });
    }
  );
};

function destroy(reqId) {
  var ctx = conns[reqId];
  if (!ctx) {
    return;
  }
  delete conns[reqId];
  ctx.req.destroy();
  ctx.res.destroy();
}

exports.abort = destroy;
exports.destroy = destroy;
exports.destroyAll = function() {
  Object.keys(conns).forEach(destroy);
};

exports.getStatus = function (reqId) {
  var ctx = reqId && conns[reqId];
  if (!ctx) {
    return;
  }
  return {
    sendStatus: ctx.sendStatus,
    receiveStatus: ctx.receiveStatus
  };
};

exports.removePending = function (req) {
  removePending(req.reqId);
};

exports.setPending = function (req) {
  var reqId = req.customParser && req.reqId;
  if (reqId && pendingReqList.indexOf(reqId) === -1) {
    pendingReqList.push(reqId);
    if (pendingReqList.length > 2000) {
      pendingReqList = pendingReqList.slice(-1600);
    }
  }
};

exports.exists = function (reqId) {
  return reqId && conns[reqId];
};

exports.getData = function (reqId) {
  var ctx = reqId && conns[reqId];
  if (ctx) {
    var result = {
      sendStatus: ctx.sendStatus,
      receiveStatus: ctx.receiveStatus,
      toServer: ctx.toServerData,
      toClient: ctx.toClientData
    };
    delete ctx.toServerData;
    delete ctx.toClientData;
    return result;
  }
  return pendingReqList.indexOf(reqId) === -1 ? undefined : 1;
};

exports.changeStatus = function (data) {
  var ctx = conns[data.reqId];
  if (!ctx) {
    return;
  }
  if (data.sendStatus >= 0) {
    ctx.setSendStatus(data.sendStatus);
  } else {
    ctx.setReceiveStatus(data.receiveStatus);
  }
  return true;
};

function getBuffer(data, charset) {
  if (data.base64) {
    try {
      return Buffer.from(data.base64, 'base64');
    } catch (e) {}
  } else if (data.text) {
    return util.toBuffer(data.text, charset);
  }
}

exports.sendData = function (data) {
  var ctx = conns[data.reqId];
  if (!ctx) {
    return;
  }
  var buf = getBuffer(data, ctx.charset);
  if (!buf) {
    return;
  }
  var toServer = data.target === 'server';
  var binary = data.type === 'bin';
  data = { binary: binary };
  if (ctx.customParser) {
    var name = toServer ? 'toServerData' : 'toClientData';
    var dataList = (ctx[name] = ctx[name] || []);
    if (dataList.length > MAX_COMPOSE_FRAME_COUNT) {
      return false;
    }
    data.base64 = buf.toString('base64');
    dataList.push(data);
    return;
  }
  if (!(toServer ? ctx.sendToServer : ctx.sendToClient)) {
    return;
  }
  data.binary = binary;
  data.length = buf.length;
  data.composer = true;
  if (toServer) {
    data.mask = true;
    ctx.sendToServer(buf, data);
  } else {
    ctx.sendToClient(buf, data);
  }
};
