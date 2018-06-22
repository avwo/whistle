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
    if (clientReq) {
      if (clientReq.abort) {
        clientReq.abort();
      } else if (clientReq.destroy) {
        clientReq.destroy();
      }
    }
    res.destroy();
  }
}

function addTransforms(req, res) {
  var reqZipPipeStream, reqIconvPipeStream, resZipPipeStream, resIconvPipeStream, svrRes;

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
    if (!reqZipPipeStream) {
      delete req.headers['content-length'];
      if (util.getContentEncoding(req.headers)) {
        reqZipPipeStream = util.getPipeZipStream(req.headers);
        req.add(reqZipPipeStream);
      } else {
        reqZipPipeStream = req;
      }
    }
    return reqZipPipeStream;
  }

  function initResZipTransform() {
    if (!resZipPipeStream) {
      resZipPipeStream = new PipeStream();
      removeContentLength();
      res.add(function(src, next) {
        var pipeZipStream = util.getPipeZipStream(res.headers);
        pipeZipStream.addHead(resZipPipeStream);
        if (resIconvPipeStream) {
          var pipeIconvStream = util.getPipeIconvStream(res.headers);
          pipeIconvStream.add(resIconvPipeStream);
          pipeZipStream.add(pipeIconvStream);
        }
        next(src.pipe(pipeZipStream));
      });
    }

    return resZipPipeStream;
  }

  res.addZipTransform = function(transform, head, tail) {
    initResZipTransform()[head ? 'addHead' : (tail ? 'addTail' : 'add')](transform);
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
    if (svrRes && (resZipPipeStream || resIconvPipeStream)) {
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
  var clientIp = util.getForwardedFor(req.headers);
  if (clientIp && util.isLocalAddress(clientIp)) {
    delete req.headers[config.CLIENT_IP_HEAD];
    clientIp = null;
  }
  if (!socket[config.CLIENT_IP_HEAD]) {
    socket[config.CLIENT_IP_HEAD] = clientIp || util.getClientIp(req);
  }
  req.clientIp = clientIp = clientIp || socket[config.CLIENT_IP_HEAD];

  var clientPort = req.headers[config.CLIENT_PORT_HEAD];
  delete req.headers[config.CLIENT_PORT_HEAD];
  if (!(clientPort > 0)) {
    clientPort = null;
  }
  if (!socket[config.CLIENT_PORT_HEAD]) {
    socket[config.CLIENT_PORT_HEAD] = clientPort || socket.remotePort;
  }
  req.clientPort = clientPort = clientPort || socket[config.CLIENT_PORT_HEAD];
  if (req.headers[config.HTTPS_FIELD] || req.socket.isHttps) {
    //防止socket长连接导致新请求的头部无法加util.HTTPS_FIELD
    if (req.headers[config.HTTPS_FIELD] === '0') {
      req.socket.isHttps = true;
    }
    req.isHttps = true;
    delete req.headers[config.HTTPS_FIELD];
  }
  if (req.headers['proxy-connection']) {
    req.headers['connection'] = req.headers['proxy-connection'];
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
    res.headers = _res.headers;
    res.trailers = _res.trailers;
    res.statusCode = _res.statusCode = util.getStatusCode(_res.statusCode);

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
