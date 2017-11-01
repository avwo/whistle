var PassThrough = require('stream').PassThrough;
var util = require('../util');

var proxy;

exports = module.exports = function(p) {
  proxy = p;
};

exports.handleConnect = function(req, res) {
  var hasEvent = util.listenerCount(proxy, 'tunnelRequest');
  if (hasEvent) {
    var url = req.fullUrl;
    var reqTrans = new PassThrough();
    reqTrans.on('error', function(err) {
      req.emit('error', err);
    });
    reqTrans._transform = function(chunk, encoding, cb) {
      proxy.emit('tunnelRequest', url);
      cb(null, chunk);
    };
    req.pipe(reqTrans).pipe(res);

    var resTrans = new PassThrough();
    resTrans.on('error', function(err) {
      req.emit('error', err);
    });
    resTrans._transform = function(chunk, encoding, cb) {
      proxy.emit('tunnelRequest', url);
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
  if (hasEvent) {
    var reqTrans = new PassThrough();
    reqTrans.on('error', function(err) {
      req.emit('error', err);
    });
    reqTrans._transform = function(chunk, encoding, cb) {
      proxy.emit('wsRequest', url);
      cb(null, chunk);
    };
    req.pipe(reqTrans).pipe(res);

    var resTrans = new PassThrough();
    resTrans.on('error', function(err) {
      req.emit('error', err);
    });
    resTrans._transform = function(chunk, encoding, cb) {
      proxy.emit('wsRequest', url);
      cb(null, chunk);
    };
    res.pipe(resTrans).pipe(req);
  } else {
    req.pipe(res).pipe(req);
  }
};
