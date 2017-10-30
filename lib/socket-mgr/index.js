var PassThrough = require('stream').PassThrough;
var util = require('../util');

var proxy;
var index = 0;

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

exports.handleConnect = function(req, res) {
  var hasEvent = util.listenerCount(proxy, 'tunnelRequest');
  var isConn = req.useTunnelPolicy;
  if (hasEvent || isConn) {
    var url = req.fullUrl;
    var reqId = req.reqId;
    var charset = util.getCharset(req.headers && req.headers['content-type']);
    var reqTrans = new PassThrough();
    reqTrans.on('error', function(err) {
      req.emit('error', err);
    });
    reqTrans._transform = function(chunk, encoding, cb) {
      hasEvent && proxy.emit('tunnelRequest', url);
      if (isConn) {
        proxy.emit('frame', {
          reqId: reqId,
          frameId: getFrameId(),
          isSend: true,
          charset: charset,
          bin: chunk
        });
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
        proxy.emit('frame', {
          charset: charset,
          reqId: reqId,
          frameId: getFrameId(),
          bin: chunk
        });
      }
      cb(null, chunk);
    };
    res.pipe(resTrans).pipe(req);
  } else {
    req.pipe(res).pipe(req);
  }
};

exports.handleWebsocket = function(req, res) {
  var url = req.fullUrl;
  var hasEvent = util.listenerCount(proxy, 'wsRequest');
  var reqId = req.reqId;
  var charset = util.getCharset(res.headers && res.headers['content-type']);
  var reqTrans = new PassThrough();
  reqTrans.on('error', function(err) {
    req.emit('error', err);
  });
  reqTrans._transform = function(chunk, encoding, cb) {
    hasEvent && proxy.emit('wsRequest', url);
    proxy.emit('frame', {
      reqId: reqId,
      frameId: getFrameId(),
      isSend: true,
      charset: charset,
      bin: chunk
    });
    cb(null, chunk);
  };
  req.pipe(reqTrans).pipe(res);

  var resTrans = new PassThrough();
  resTrans.on('error', function(err) {
    req.emit('error', err);
  });
  resTrans._transform = function(chunk, encoding, cb) {
    hasEvent && proxy.emit('wsRequest', url);
    proxy.emit('frame', {
      charset: charset,
      reqId: reqId,
      frameId: getFrameId(),
      bin: chunk
    });
    cb(null, chunk);
  };
  res.pipe(resTrans).pipe(req);
};
