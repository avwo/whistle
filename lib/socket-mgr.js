var PassThrough = require('stream').PassThrough;
var wsParser = require('ws-parser');
var util = require('./util');
var Buffer = require('safe-buffer').Buffer;

var proxy;
var index = 0;
var MAX_PAYLOAD = 1024 * 128;
var conns = {};

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
    delete conns[req.reqId];
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

function setConnStatus(ctx, status, statusObj, emitData, name) {
  statusObj.pause = statusObj.ignore = undefined;
  status = getStatus(ctx, status, name);
  if (status === 1) {
    statusObj.pause = true;
    return;
  }
  if (status === 2) {
    statusObj.ignore = true;
    statusObj.chunk && emitData(statusObj.chunk, true, statusObj.ignore);
    statusObj.chunk = null;
  }
  if (statusObj.callback) {
    statusObj.callback(null, statusObj.chunk);
    statusObj.callback = null;
    statusObj.chunk = null;
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
        setSendStatus: function(status) {
          setConnStatus(ctx, status, sendStatus, emitData, 'sendStatus');
        },
        setReceiveStatus: function(status) {
          setConnStatus(ctx, status, receiveStatus, emitData);
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

exports.handleWebsocket = function(req, res) {
  var url = req.fullUrl;
  var hasEvent = util.listenerCount(proxy, 'wsRequest');
  var reqId = req.reqId;
  var pauseReq, pauseRes;
  var ignoreReq, ignoreRes;
  var reqCallback, resCallback;
  var clientData = [];
  var serverData = [];
  res.headers = res.headers || {};
  var charset = util.getCharset(res.headers['content-type']) || '';
  var ctx = conns[reqId] = {
    isWs: true,
    req: req,
    res: res,
    charset: charset,
    setSendStatus: function(status) {
      getStatus(ctx, status, 'sendStatus');
    },
    setReceiveStatus: function(status) {
      getStatus(ctx, status);
    },
    sendToServer: function(data) {
      serverData.push(data);
    },
    sendToClient: function(data) {
      clientData.push(data);
    }
  };
  var reqTrans = new PassThrough();
  reqTrans.on('error', function(err) {
    req.emit('error', err);
  });
  var reqReceiver = wsParser.getReceiver(res);
  reqReceiver.onData = function(data, opts) {
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      isClient: true,
      charset: charset,
      mask: opts.mask,
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
    reqReceiver.add(chunk);
    cb(null, chunk);
  };
  req.pipe(reqTrans).pipe(res);

  var resTrans = new PassThrough();
  resTrans.on('error', function(err) {
    req.emit('error', err);
  });
  var resReceiver =  wsParser.getReceiver(res, true);
  resReceiver.onData = function(data, opts) {
    proxy.emit('frame', {
      charset: charset,
      reqId: reqId,
      frameId: getFrameId(),
      bin: getBinary(data, opts.length),
      mask: opts.mask,
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
    resReceiver.add(chunk);
    cb(null, chunk);
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
  data = {
    isBinary: data.type === 'bin',
    data: buf
  }; 
  if (isServer) {
    ctx.sendToServer(data);
  } else {
    ctx.sendToClient(data);
  }
};
