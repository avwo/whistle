var PassThrough = require('stream').PassThrough;
var wsParser = require('ws-parser');
var util = require('./util');
var Buffer = require('safe-buffer').Buffer;

var INTERVAL = 22 * 1000;
var proxy;
var index = 0;
var MAX_PAYLOAD = 1024 * 128;
var conns = {};
var PING = new Buffer.from('iQA=', 'base64');
var PONG = new Buffer.from('ioAn6ubf', 'base64');
var PAUSE_STATUS = 1;
var IGNORE_STATUS = 2;

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

exports = module.exports = function(p) {
  proxy = p;
};

function handleClose(req, res, reqReceiver, resReceiver) {
  var closed;
  var callback = function(err) {
    if (closed) {
      return;
    }
    closed = true;
    var ctx = conns[req.reqId];
    ctx && ctx.clearup();
    proxy.emit('frame', {
      reqId:  req.reqId,
      frameId: getFrameId(),
      closed: true,
      err: err && err.stack
    });
    reqReceiver && reqReceiver.cleanup();
    resReceiver && resReceiver.cleanup();
  };
  util.onSocketEnd(req, callback);
  util.onSocketEnd(res, callback);
}

function getStatus(ctx, status, name) {
  status = parseInt(status, 10);
  name = name || 'receiveStatus';
  var oldStatus = ctx[name] || 0;
  status = ctx[name] = (status > 0 || status < 3) ? status : 0;
  return status !== oldStatus ? status : -1;
}

function setConnStatus(ctx, status, statusObj, name, emitData, fromClient) {
  statusObj.pause = statusObj.ignore = undefined;
  status = getStatus(ctx, status, name);
  if (status === 1) {
    statusObj.pause = true;
    return;
  }
  if (status === 2) {
    statusObj.ignore = true;
    emitData && statusObj.chunk && emitData(statusObj.chunk, fromClient, statusObj.ignore);
    statusObj.chunk = null;
    statusObj.ignoring = !!statusObj.callback;
  }
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

exports.handleConnect = function(req, res) {
  var hasEvent = util.listenerCount(proxy, 'tunnelRequest');
  var isConn = req.inspectFrames;
  if (hasEvent || isConn) {
    var url = req.fullUrl;
    var reqId = req.reqId;
    var charset = util.getCharset(req.headers && req.headers['content-type']) || '';
    var sendStatus = {};
    var receiveStatus = {};
    
    var emitData = function(chunk, fromClient, ignore) {
      proxy.emit('frame', {
        reqId: reqId,
        frameId: getFrameId(),
        isClient: fromClient,
        charset: charset,
        length: chunk.length,
        ignore: ignore,
        bin: chunk
      });
    };
    if (isConn) {
      var ctx = conns[reqId] = {
        req: req,
        res: res,
        charset: charset,
        clearup: function() {
          delete conns[reqId];
          sendStatus.callback = null;
          receiveStatus.callback = null;
        },
        setSendStatus: function(status) {
          setConnStatus(ctx, status, sendStatus, 'sendStatus', emitData, true);
        },
        setReceiveStatus: function(status) {
          setConnStatus(ctx, status, receiveStatus, null, emitData);
        },
        sendToServer: function(data) {
          data = data.data;
          res.write(data);
          emitData(data, true);
        },
        sendToClient: function(data) {
          data = data.data;
          req.write(data);
          emitData(data);
        }
      };
      initStatus(ctx, req.enable);
    }
    var reqTrans = new PassThrough();
    reqTrans.on('error', function(err) {
      req.emit('error', err);
    });
    reqTrans._transform = function(chunk, encoding, cb) {
      hasEvent && proxy.emit('tunnelRequest', url);
      if (isConn) {
        if (sendStatus.pause) {
          sendStatus.chunk = chunk;
          sendStatus.callback = cb;
          return;
        }
        emitData(chunk, true, sendStatus.ignore);
        if (sendStatus.ignore) {
          chunk = null;
        }
      }
      cb(null, chunk);
    };
    req.pipe(reqTrans).pipe(res);
    
    var resTrans = new PassThrough();
    resTrans.on('error', function(err) {
      req.emit('error', err);
    });

    resTrans._transform = function(chunk, encoding, cb) {
      hasEvent && proxy.emit('tunnelRequest', url);
      if (isConn) {
        if (receiveStatus.pause) {
          receiveStatus.chunk = chunk;
          receiveStatus.callback = cb;
          return;
        }
        emitData(chunk, undefined, receiveStatus.ignore);
        if (receiveStatus.ignore) {
          chunk = null;
        }
      }
      cb(null, chunk);
    };
    res.pipe(resTrans).pipe(req);
    if (isConn) {
      handleClose(req, res);
    }
  } else {
    req.pipe(res).pipe(req);
  }
};

function getBinary(data, len) {
  return len >MAX_PAYLOAD ? data.slice(0, MAX_PAYLOAD) : data;
}

function drainData(status, socket, receiver) {
  if (!status.sender) {
    status.sender = wsParser.getSender(socket);
  }
  status.data.forEach(function(item) {
    status.sender.send(item.data, item);
    receiver.onData(item.data, item);
  });
  status.data = [];
  receiver.ping();
}

function handleFrame(receiver, socket, status, chunk, cb) {
  if (!receiver.existsCacheData) {
    status.ignoring = status.ignore;
    if (status.pause) {
      status.callback = cb;
      status.chunk = chunk;
      status.addToReceiver = function() {
        receiver.add(chunk);
      };
      drainData(status, socket, receiver);
      return;
    }
    if (status.ignore) {
      drainData(status, socket, receiver);
    }
  }
  var toRead = receiver.add(chunk);
  if (status.ignoring) {
    if (!status.ignore && toRead >= 0) {
      status.ignoring = false;
      socket.write(chunk.slice(toRead));
    }
    chunk = null;
  } else if (toRead >= 0 && (status.pause || 
    status.ignore || status.data.length)) {
    if (toRead) {
      var readAll = toRead === chunk.length;
      status.chunk = readAll ? null : chunk.slice(toRead);
      socket.write(readAll ? chunk : chunk.slice(0, toRead));
    } else {
      status.chunk = chunk;
    }
    if (status.pause) {
      status.callback = cb;
      drainData(status, socket, receiver);
      return;
    }
    if (status.ignore) {
      status.ignoring = true;
      chunk = null;
      drainData(status, socket, receiver);
    }
  }
  if (chunk && status.timer) {
    clearInterval(status.timer);
    status.timer = null;
  }
  cb(null, chunk);
}

exports.handleWebsocket = function(req, res) {
  var url = req.fullUrl;
  var hasEvent = util.listenerCount(proxy, 'wsRequest');
  var reqId = req.reqId;
  var sendStatus = { data: [] };
  var receiveStatus = { data: [] };
 
  res.headers = res.headers || {};
  var charset = util.getCharset(res.headers['content-type']) || '';
  var ctx = conns[reqId] = {
    isWs: true,
    req: req,
    res: res,
    charset: charset,
    clearup: function() {
      delete conns[reqId];
      sendStatus.callback = null;
      receiveStatus.callback = null;
      sendStatus.addToReceiver = null;
      receiveStatus.addToReceiver = null;
      clearInterval(sendStatus.timer);
      clearInterval(receiveStatus.timer);
    },
    setSendStatus: function(status) {
      setConnStatus(ctx, status, sendStatus, 'sendStatus');
    },
    setReceiveStatus: function(status) {
      setConnStatus(ctx, status, receiveStatus);
    },
    sendToServer: function(data) {
      sendStatus.data.push(data);
      if (sendStatus.ignoring || sendStatus.callback || !reqReceiver.existsCacheData) {
        drainData(sendStatus, res, reqReceiver);
      }
    },
    sendToClient: function(data) {
      receiveStatus.data.push(data);
      if (receiveStatus.ignoring || receiveStatus.callback || !resReceiver.existsCacheData) {
        drainData(receiveStatus, req, resReceiver);
      }
    }
  };
  initStatus(ctx, req.enable);
  var reqTrans = new PassThrough();
  reqTrans.on('error', function(err) {
    req.emit('error', err);
  });
  var reqReceiver = wsParser.getReceiver(res);
  reqReceiver.ping = function() {
    if (sendStatus.timer || req.disable.pong) {
      return;
    }
    res.write(PONG);
    sendStatus.timer = setInterval(function() {
      res.write(PONG);
    }, INTERVAL);
  };
  reqReceiver.onData = function(data, opts) {
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      isClient: true,
      charset: charset,
      mask: opts.mask,
      ignore: opts.data ? undefined : sendStatus.ignoring,
      bin: getBinary(data, opts.length),
      compressed: opts.compressed,
      length: opts.length,
      opcode: opts.opcode
    });
  };
  reqReceiver.onerror = function(err) {
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      isClient: true,
      err: err.stack,
      bin: ''
    });
  };
  reqTrans._transform = function(chunk, encoding, cb) {
    hasEvent && proxy.emit('wsRequest', url);
    handleFrame(reqReceiver, res, sendStatus, chunk, cb);
  };
  req.pipe(reqTrans).pipe(res);

  var resTrans = new PassThrough();
  resTrans.on('error', function(err) {
    req.emit('error', err);
  });
  var resReceiver =  wsParser.getReceiver(res, true);
  resReceiver.ping = function() {
    if (receiveStatus.timer || req.disable.ping) {
      return;
    }
    req.write(PING);
    receiveStatus.timer = setInterval(function() {
      req.write(PING);
    }, INTERVAL);
  };
  resReceiver.onData = function(data, opts) {
    proxy.emit('frame', {
      charset: charset,
      reqId: reqId,
      frameId: getFrameId(),
      bin: getBinary(data, opts.length),
      mask: opts.mask,
      ignore: opts.data ? undefined : receiveStatus.ignoring,
      compressed: opts.compressed,
      length: opts.length,
      opcode: opts.opcode
    });
  };
  resReceiver.onerror = function(err) {
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      err: err.stack,
      bin: ''
    });
  };
  resTrans._transform = function(chunk, encoding, cb) {
    hasEvent && proxy.emit('wsRequest', url);
    handleFrame(resReceiver, req, receiveStatus, chunk, cb);
  };
  res.pipe(resTrans).pipe(req);
  handleClose(req, res, reqReceiver, resReceiver);
};

exports.abort = function(reqId) {
  var ctx = conns[reqId];
  if (!ctx) {
    return;
  }
  delete conns[reqId];
  ctx.req.destroy();
  ctx.res.destroy();
};

exports.getStatus = function(reqId) {
  var ctx = reqId && conns[reqId];
  if (!ctx) {
    return;
  }
  return {
    sendStatus: ctx.sendStatus,
    receiveStatus: ctx.receiveStatus
  };
};

exports.changeStatus = function(data) {
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
    } catch(e) {}
  } else if (data.text) {
    return util.toBuffer(data.text, charset);
  }
}

exports.sendData = function(data) {
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
  data = {
    binary: binary,
    opcode: binary ? 2 : 1,
    length: buf.length,
    data: buf
  }; 
  if (isServer) {
    data.mask = true;
    ctx.sendToServer(data);
  } else {
    ctx.sendToClient(data);
  }
};
