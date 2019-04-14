var PipeStream = require('pipestream');
var util = require('./util');
var config = require('./config');

var HTTPS_RE = /^https:/i;

function addErrorEvents(req, res) {
  var clientReq;
  req.on('dest', function(_req) {
    clientReq = _req.on('error', util.noop);
  }).on('error', abort).once('close', abort);

  res.on('src', function(_res) {
    _res.on('error', abort);
  }).on('error', abort);

  function abort(err) {
    if (clientReq === false) {
      return;
    }
    if (clientReq) {
      if (clientReq.abort) {
        clientReq.abort();
      } else if (clientReq.destroy) {
        clientReq.destroy();
      }
      clientReq = false;
    }
    res.destroy();
  }
}

function addTransforms(req, res) {
  var reqIconvPipeStream, resIconvPipeStream, svrRes;

  req.addTextTransform = function(transform) {
    if (!reqIconvPipeStream) {
      reqIconvPipeStream = util.getPipeIconvStream(req.headers);
      initReqZipTransform().add(reqIconvPipeStream);
    }
    reqIconvPipeStream.add(transform);
    return req;
  };

  req.addZipTransform = function(transform, head, tail) {
    initReqZipTransform()[head ? 'addHead' : (tail ? 'addTail' : 'add')](transform);
    return req;
  };

  function initReqZipTransform() {
    if (!req._hasZipBody) {
      delete req.headers['content-length'];
      req._hasZipBody = true;
    }
    return req;
  }

  function initResZipTransform() {
    if (!res._hasZipBody) {
      res._hasZipBody = true;
      removeContentLength();
      res.add(function(src, next) {
        var pipeIconvStream = util.getPipeIconvStream(res.headers);
        if (resIconvPipeStream) {
          pipeIconvStream.add(resIconvPipeStream);
        }
        next(src.pipe(pipeIconvStream));
      });
    }
  }

  res.addZipTransform = function(transform, head, tail) {
    initResZipTransform();
    res[head ? 'addHead' : (tail ? 'addTail' : 'add')](transform);
    return res;
  };
  res.addTextTransform = function(transform, head, tail) {
    if (!resIconvPipeStream) {
      resIconvPipeStream = new PipeStream();
      initResZipTransform();
    }
    resIconvPipeStream[head ? 'addHead' : (tail ? 'addTail' : 'add')](transform);
    return res;
  };

  res.on('src', function(_res) {
    svrRes = _res;
    removeContentLength();
  });

  function removeContentLength() {
    if (svrRes && res._hasZipBody) {
      delete svrRes.headers['content-length'];
    }
  }
}

module.exports = function(req, res, next) {
  PipeStream.wrapSrc(req);
  PipeStream.wrapDest(res);
  addTransforms(req, res);
  addErrorEvents(req, res);
  var socket = req.socket || {};
  var clientInfo = util.parseClientInfo(req);
  var clientIp = clientInfo[0] || util.getForwardedFor(req.headers);
  if (clientIp && util.isLocalAddress(clientIp)) {
    delete req.headers[config.CLIENT_IP_HEAD];
    clientIp = null;
  }
  if (!socket[config.CLIENT_IP_HEAD]) {
    socket[config.CLIENT_IP_HEAD] = clientIp || util.getClientIp(req);
  }
  req.clientIp = clientIp = clientIp || socket[config.CLIENT_IP_HEAD];
  req.method = util.getMethod(req.method);
  var clientPort = clientInfo[1] || req.headers[config.CLIENT_PORT_HEAD];
  delete req.headers[config.CLIENT_PORT_HEAD];
  if (!(clientPort > 0)) {
    clientPort = null;
  }
  if (!socket[config.CLIENT_PORT_HEAD]) {
    socket[config.CLIENT_PORT_HEAD] = clientPort || socket.remotePort;
  }
  req.clientPort = clientPort = clientPort || socket[config.CLIENT_PORT_HEAD];
  if (req.headers[config.HTTPS_FIELD] || req.socket.isHttps) {
    req.isHttps = true;
    delete req.headers[config.HTTPS_FIELD];
  }
  if (req.headers['proxy-connection']) {
    req.headers.connection = req.headers['proxy-connection'];
  }
  delete req.headers['proxy-connection'];
  if (!req.isHttps && HTTPS_RE.test(req.url)) {
    req.isHttps = true;
  }
  var responsed;
  res.response = function(_res) {
    if (responsed) {
      return;
    }
    responsed = true;
    if (_res.realUrl) {
      req.realUrl = res.realUrl = _res.realUrl;
    }
    res.headers = req.resHeaders = _res.headers;
    res.trailers = _res.trailers;
    res.statusCode = req.statusCode = _res.statusCode = util.getStatusCode(_res.statusCode);
    util.drain(req, function() {
      if (util.getStatusCode(_res.statusCode)) {
        res.writeHead(_res.statusCode, _res.headers);
        res.src(_res);
        _res.trailers && res.addTrailers(_res.trailers);
      } else {
        util.sendStatusCodeError(res, _res);
      }
    });
  };

  next();
};
