var PipeStream = require('pipestream');
var util = require('./util');
var config = require('./config');

var HTTPS_RE = /^https:/i;

function addErrorEvents(req, res) {
  var clientReq;
  req.on('dest', function(_req) {
    clientReq = _req;
    if (!req.noReqBody) {
      clientReq.on('error', abort);
    }
  }).on('error', abort).once('close', abort);
  res.on('src', function(_res) {
    if (clientReq && req.noReqBody) {
      clientReq.on('error', abort);
    }
    _res.on('error', abort);
  }).on('error', abort);

  function abort(err) {
    if (clientReq === false) {
      return;
    }
    req.hasError = true;
    clientReq = clientReq || req._clientReq;
    if (clientReq) {
      if (clientReq.abort) {
        clientReq.abort();
      } else if (clientReq.destroy) {
        clientReq.destroy();
      }
      clientReq = false;
    }
    if (req._hasRespond || res._headerSent || !res.writable || (err && (err.code === 'ERR_WHISTLE_ABORTED'))) {
      return res.destroy();
    }
    err = util.getErrorStack(err || 'Closed');
    res.response(util.wrapGatewayError(err));
  }
}

function addTunnelData(socket, headers, key, tempKey) {
  var value = socket[key] || headers[tempKey];
  if (value) {
    delete headers[tempKey];
    socket[key] = headers[key] = value;
  }
}

function addTransforms(req, res) {
  var reqIconvPipeStream, resIconvPipeStream, svrRes, initedResTransform;

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
    if (!req._needGunzip) {
      delete req.headers['content-length'];
      req._needGunzip = true;
    }
    return req;
  }

  function initResZipTransform() {
    if (!initedResTransform) {
      initedResTransform = true;
      res._needGunzip = true;
      removeContentLength();
      res.add(function(src, next) {
        if (resIconvPipeStream) {
          var pipeIconvStream = util.getPipeIconvStream(res.headers);
          pipeIconvStream.add(resIconvPipeStream);
          next(src.pipe(pipeIconvStream));
        } else {
          next(src);
        }
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
    if (svrRes && res._needGunzip) {
      delete svrRes.headers['content-length'];
    }
  }
}

module.exports = function(req, res, next) {
  PipeStream.wrapSrc(req);
  PipeStream.wrapDest(res);
  addTransforms(req, res);
  addErrorEvents(req, res);
  req.isPluginReq = util.checkPluginReqOnce(req);
  var headers = req.headers;
  var socket = req.socket || {};
  var clientInfo = util.parseClientInfo(req);
  var clientIp = clientInfo[0] || util.getForwardedFor(headers);
  if (clientIp && util.isLocalAddress(clientIp)) {
    delete headers[config.CLIENT_IP_HEAD];
    clientIp = null;
  }
  if (!socket[config.CLIENT_IP_HEAD]) {
    socket[config.CLIENT_IP_HEAD] = clientIp || util.getClientIp(req);
  }
  req.clientIp = clientIp = clientIp || socket[config.CLIENT_IP_HEAD];
  req.method = util.getMethod(req.method);
  var clientPort = clientInfo[1] || headers[config.CLIENT_PORT_HEAD];
  delete headers[config.CLIENT_PORT_HEAD];
  if (!(clientPort > 0)) {
    clientPort = null;
  }
  if (!socket[config.CLIENT_PORT_HEAD]) {
    socket[config.CLIENT_PORT_HEAD] = clientPort || socket.remotePort;
  }
  req.clientPort = clientPort = clientPort || socket[config.CLIENT_PORT_HEAD];
  if (req.socket.isHttps || headers[config.HTTPS_FIELD] || headers[config.HTTPS_PROTO_HEADER] === 'https') {
    req.isHttps = true;
    delete headers[config.HTTPS_FIELD];
    delete headers[config.HTTPS_PROTO_HEADER];
  }
  if (headers['proxy-connection']) {
    headers.connection = headers['proxy-connection'];
  }
  delete headers['proxy-connection'];
  if (!req.isHttps && HTTPS_RE.test(req.url)) {
    req.isHttps = true;
  }
  addTunnelData(socket, headers, config.TEMP_CLIENT_ID_HEADER, config.TEMP_CLIENT_ID_HEADER);
  addTunnelData(socket, headers, config.TUNNEL_DATA_HEADER, config.TEMP_TUNNEL_DATA_HEADER);
  if (headers[config.ALPN_PROTOCOL_HEADER]) {
    if (req.isHttps) {
      req.isH2 = true;
      req.rawHeaders = [];
    }
    delete headers[config.ALPN_PROTOCOL_HEADER];
  }
  res.response = function(_res) {
    if (req._hasRespond) {
      return;
    }
    req._hasRespond = true;
    if (_res.realUrl) {
      req.realUrl = res.realUrl = _res.realUrl;
    }
    res.headers = req.resHeaders = _res.headers;
    res.statusCode = req.statusCode = _res.statusCode = util.getStatusCode(_res.statusCode);
    util.drain(req, function() {
      if (util.getStatusCode(_res.statusCode)) {
        res.src(_res);
        res.writeHead(_res.statusCode, _res.headers);
      } else {
        util.sendStatusCodeError(res, _res);
      }
    });
  };

  next();
};
