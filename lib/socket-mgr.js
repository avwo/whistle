var PassThrough = require('stream').PassThrough;
var pluginMgr = require('./plugins');
var wsParser = require('ws-parser');
var util = require('./util');
var config = require('./config');
var Buffer = require('safe-buffer').Buffer;

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

function isHide(req) {
  return !config.captureData || (req._filters.hide && !req.disable.hide);
}

function emitDataToProxy(req, chunk, fromClient, ignore) {
  if (isHide(req) || req._emittedClosed) {
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

function handleConnSend(ctx, reqTrans, sendStatus, eventName) {
  var req = ctx.req;
  var res = ctx.res;
  var hasEvent = ctx.hasEvent;
  var writer = res.pipeWriter || res;
  var url = ctx.url;
  ctx.sendToServer = function (data) {
    data = data.data;
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
    emitDataToProxy(req, chunk, true, sendStatus.ignore);
    if (sendStatus.ignore) {
      chunk = null;
    }
    cb(null, chunk);
  };
}

function handleConnReceive(ctx, resTrans, receiveStatus, eventName) {
  var req = ctx.req;
  var hasEvent = ctx.hasEvent;
  var url = ctx.url;
  var writer = req.pipeWriter || req;
  ctx.sendToClient = function (data) {
    data = data.data;
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
    emitDataToProxy(req, chunk, undefined, receiveStatus.ignore);
    if (receiveStatus.ignore) {
      chunk = null;
    }
    cb(null, chunk);
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

function drainData(status, socket, receiver, toServer) {
  if (!status.sender) {
    try {
      status.sender = wsParser.getSender(socket.pipeWriter || socket, toServer);
    } catch (e) {}
  }
  status.sender &&
    status.data.forEach(function (item) {
      status.sender.send(item.data, item);
      receiver.onData(item.data, item);
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
      drainData(status, socket, receiver, toServer);
      return;
    }
    if (status.ignore) {
      drainData(status, socket, receiver, toServer);
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
      drainData(status, socket, receiver, toServer);
      return;
    }
    if (status.ignore) {
      status.ignoring = true;
      chunk = null;
      drainData(status, socket, receiver, toServer);
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

function handleWsSend(ctx, reqTrans, sendStatus, eventName) {
  var req = ctx.req;
  var res = ctx.res;
  var url = ctx.url;
  var hideWs = isHide(req);
  var reqReceiver;
  if (!hideWs) {
    try {
      reqReceiver = wsParser.getReceiver(res);
    } catch (e) {
      hideWs = true;
    }
  }
  var curEvent = eventName || 'wsRequest';
  var hasEvent = ctx.hasEvent;
  if (hideWs) {
    if (hasEvent) {
      reqTrans._transform = function (chunk, _, cb) {
        proxy.emit(curEvent, url);
        cb(null, chunk);
      };
    }
    return;
  }
  var reqId = req.reqId;
  util.onSocketEnd(res, function(err) {
    reqReceiver.flush(function() {
      reqReceiver.cleanup();
    });
  });
  ctx.sendToServer = function (data) {
    if (sendStatus.data.length > MAX_COMPOSE_FRAME_COUNT) {
      return false;
    }
    sendStatus.data.push(data);
    if (
      sendStatus.ignoring ||
      sendStatus.callback ||
      !reqReceiver.existsCacheData
    ) {
      drainData(sendStatus, res, reqReceiver, true);
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
  reqReceiver.onData = function (data, opts) {
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
      length: opts.length,
      opcode: eventName ? undefined : opcode
    });
  };
  reqReceiver.onerror = function (err) {
    if (req._emittedClosed) {
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
  reqTrans._transform = function (chunk, _, cb) {
    hasEvent && proxy.emit(curEvent, url);
    handleFrame(reqReceiver, res, sendStatus, chunk, cb, true);
  };
}

function handleWsReceive(ctx, resTrans, receiveStatus, eventName) {
  var req = ctx.req;
  var res = ctx.res;
  var url = ctx.url;
  var hideWs = isHide(req);
  var resReceiver;
  if (!hideWs) {
    try {
      resReceiver = wsParser.getReceiver(res, true);
    } catch (e) {
      hideWs = true;
    }
  }
  var curEvent = eventName || 'wsRequest';
  var hasEvent = ctx.hasEvent;
  if (hideWs) {
    if (hasEvent) {
      resTrans._transform = function (chunk, _, cb) {
        proxy.emit(curEvent, url);
        cb(null, chunk);
      };
    }
    return;
  }
  var reqId = req.reqId;
  util.onSocketEnd(req, function(err) {
    resReceiver.flush(function() {
      resReceiver.cleanup();
    });
  });
  ctx.sendToClient = function (data) {
    if (receiveStatus.data.length > MAX_COMPOSE_FRAME_COUNT) {
      return false;
    }
    receiveStatus.data.push(data);
    if (
      receiveStatus.ignoring ||
      receiveStatus.callback ||
      !resReceiver.existsCacheData
    ) {
      drainData(receiveStatus, req, resReceiver);
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
  resReceiver.onData = function (data, opts) {
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
      length: opts.length,
      opcode: eventName ? undefined : opcode
    });
  };
  resReceiver.onerror = function (err) {
    if (req._emittedClosed) {
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
  resTrans._transform = function (chunk, _, cb) {
    hasEvent && proxy.emit(curEvent, url);
    handleFrame(resReceiver, req, receiveStatus, chunk, cb);
  };
}

function getContext(req, res, hasEvent, sendStatus, receiveStatus) {
  var reqId = req.reqId;
  var ctx = (conns[reqId] = {
    customParser: req.customParser,
    req: req,
    res: res,
    hasEvent: hasEvent,
    url: req.fullUrl,
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

exports.handleUpgrade = function (req, res) {
  if (req.isPluginReq) {
    handleClose(req, res, true);
    return req.pipe(res).pipe(req);
  }
  var url = req.fullUrl;
  var customParser = req.customParser;
  var reqId = req.reqId;
  var sendStatus = { data: [] };
  var receiveStatus = { data: [] };
  var emitError = function (err) {
    req.emit('error', err);
  };
  var reqTrans = new PassThrough();
  var resTrans = new PassThrough();

  reqTrans.on('error', emitError);
  resTrans.on('error', emitError);
  res.headers = res.headers || {};
  req.wsExts = res.headers['sec-websocket-extensions'] || '';
  handleClose(req, res);
  pluginMgr.getWsPipe(
    req,
    res,
    function (reqRead, reqWrite, resRead, resWrite) {
      customParser && removePending(reqId);
      if (req._hasClosed) {
        return;
      }
      var hasEvent = util.listenerCount(proxy, 'wsRequest');
      var ctx = (conns[reqId] = getContext(
        req,
        res,
        hasEvent,
        sendStatus,
        receiveStatus
      ));
      if (customParser) {
        var handleInspect = function (chunk, _, cb) {
          hasEvent && proxy.emit('wsRequest', url);
          cb(null, chunk);
        };
        reqTrans._transform = handleInspect;
        resTrans._transform = handleInspect;
      } else {
        if (reqWrite) {
          reqWrite.headers = res.headers;
          res.pipeWriter = reqWrite;
        }
        if (resWrite) {
          resWrite.headers = res.headers;
          req.pipeWriter = resWrite;
        }
        handleWsSend(ctx, reqTrans, sendStatus);
        handleWsReceive(ctx, resTrans, receiveStatus);
      }
      pipeStream(req, reqRead)
        .pipe(reqTrans)
        .pipe(pipeStream(reqWrite, res, true));
      pipeStream(res, resRead)
        .pipe(resTrans)
        .pipe(pipeStream(resWrite, req, true));
    }
  );
};

exports.handleConnect = function (req, res, isUpgrade) {
  var eventName = isUpgrade ? 'wsRequest' : 'tunnelRequest';
  var hasEvent = util.listenerCount(proxy, eventName);
  var isConn = isUpgrade || req.inspectFrames;
  if (req.isPluginReq || (!isConn && !hasEvent)) {
    handleClose(req, res, true);
    return req.pipe(res).pipe(req);
  }
  var url = req.fullUrl;
  var reqId = req.reqId;
  var customParser = req.customParser;
  var sendStatus = { data: [] };
  var receiveStatus = { data: [] };
  var ctx = '';
  var reqTrans = new PassThrough();
  var resTrans = new PassThrough();
  var emitError = function (err) {
    req.emit('error', err);
  };
  reqTrans.on('error', emitError);
  resTrans.on('error', emitError);
  res.headers = res.headers || req.headers;
  handleClose(req, res, !isConn);
  req._isUpgrade = isUpgrade;
  pluginMgr.getTunnelPipe(
    req,
    res,
    function (reqRead, reqWrite, resRead, resWrite) {
      customParser && removePending(reqId);
      if (req._hasClosed) {
        return;
      }
      var hide = isHide(req);
      if (isConn && !hide) {
        ctx = getContext(req, res, hasEvent, sendStatus, receiveStatus);
      }

      if (customParser || hide || !isConn) {
        var handleInspect = function (chunk, _, cb) {
          hasEvent && proxy.emit(eventName, url);
          cb(null, chunk);
        };
        reqTrans._transform = handleInspect;
        resTrans._transform = handleInspect;
      } else {
        req.wsExts = res.wsExts = '';
        if (reqWrite) {
          reqWrite.wsExts = '';
          res.pipeWriter = reqWrite;
        }
        if (resWrite) {
          resWrite.wsExts = '';
          req.pipeWriter = resWrite;
        }
        if (reqRead && reqWrite) {
          handleWsSend(ctx, reqTrans, sendStatus, eventName);
        } else {
          handleConnSend(ctx, reqTrans, sendStatus, eventName);
        }
        if (resRead && resWrite) {
          handleWsReceive(ctx, resTrans, receiveStatus, eventName);
        } else {
          handleConnReceive(ctx, resTrans, receiveStatus, eventName);
        }
      }

      pipeStream(req, reqRead)
        .pipe(reqTrans)
        .pipe(pipeStream(reqWrite, res, true));
      pipeStream(res, resRead)
        .pipe(resTrans)
        .pipe(pipeStream(resWrite, req, true));
    }
  );
};

exports.abort = function (reqId) {
  var ctx = conns[reqId];
  if (!ctx) {
    return;
  }
  delete conns[reqId];
  ctx.req.destroy();
  ctx.res.destroy();
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
  var isServer = data.target === 'server';
  var binary = data.type === 'bin';
  data = { binary: binary };
  if (ctx.customParser) {
    var name = isServer ? 'toServerData' : 'toClientData';
    var dataList = (ctx[name] = ctx[name] || []);
    if (dataList.length > MAX_COMPOSE_FRAME_COUNT) {
      return false;
    }
    data.base64 = buf.toString('base64');
    dataList.push(data);
    return;
  }
  data.binary = binary;
  data.length = buf.length;
  data.data = buf;
  if (isServer) {
    data.mask = true;
    return ctx.sendToServer(data);
  } else {
    return ctx.sendToClient(data);
  }
};
