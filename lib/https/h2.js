var https = require('https');
var LRU = require('lru-cache');
var tls = require('tls');
var sockx = require('sockx');
var PassThrough = require('stream').PassThrough;
var util = require('../util');
var config = require('../config');
var http2 = config.enableH2 ? require('http2') : null;

var SUPPORTED_PROTOS = ['h2', 'http/1.1', 'http/1.0'];
var H2_SETTINGS = { enablePush: false };
var H2_SVR_SETTINGS = { enablePush: false, enableConnectProtocol: false };
var CACHE_TIMEOUT = 1000 * 60 * 2;
var INTERVAL = 1000 * 60;
var clients = {};
var notH2 = new LRU({max: 2560});
var pendingH2 = {};
var pendingList = {};
var TIMEOUT = 36000;
var REQ_TIMEOUT = 16000;
var CONCURRENT = 3;

setInterval(function() {
  var now = Date.now();
  Object.keys(clients).forEach(function(name) {
    var client = clients[name];
    if (now - client._updateTime > CACHE_TIMEOUT) {
      client.close();
      delete clients[name];
    }
  });
}, INTERVAL);


function getKey(options) {
  var proxyOpts = options._proxyOptions;
  var proxyType = '';
  if (proxyOpts) {
    proxyType = [proxyOpts.proxyType, proxyOpts.proxyHost, proxyOpts.proxyPort, proxyOpts.headers.host, proxyOpts.proxyTunnelPath || ''].join(':');
  }
  return [options.servername, options.host, options.port || '', proxyType, options.cacheKey || ''].join('/');
}

function getSocksSocket(options, callback) {
  var done;
  var handleCallback = function(err, socket) {
    if (!done) {
      done = true;
      callback(err, socket);
    }
  };
  var proxyOpts = options._proxyOptions;
  var client = sockx.connect({
    localDNS: false,
    proxyHost: proxyOpts.proxyHost,
    proxyPort: proxyOpts.proxyPort,
    auths: config.getAuths(proxyOpts),
    host: options.host,
    port: options.port || 443
  }, function(socket) {
    handleCallback(null, socket);
  });
  client.on('error', handleCallback);
}

function getTunnelSocket(options, callback) {
  var done;
  var handleCallback = function(err, socket) {
    if (!done) {
      done = true;
      callback(err, socket);
    }
  };
  var connReq = config.connect(options._proxyOptions, function(socket) {
    handleCallback(null, socket);
  });
  connReq.on('error', handleCallback);
}

function addCert(opts, options) {
  if (options.cert) {
    opts.key = options.key;
    opts.cert = options.cert;
  } else if (options.pfx) {
    opts.pfx = options.pfx;
    if (options.passphrase) {
      opts.passphrase = options.passphrase;
    }
  }
  return opts;
}

function getProxySocket(options, callback, ciphers) {
  var handleConnect = function(err, socket) {
    if (err) {
      return callback(err);
    }
    var timer = setTimeout(function() {
      if (timer) {
        timer = null;
        socket.destroy();
      }
    }, REQ_TIMEOUT);
    var handleCallback = function(err) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        callback(err, err ? null : socket);
      }
    };
    try {
      socket = tls.connect(addCert({
        servername: options.servername,
        socket: socket,
        rejectUnauthorized: config.rejectUnauthorized,
        ALPNProtocols: SUPPORTED_PROTOS,
        NPNProtocols: SUPPORTED_PROTOS,
        ciphers: ciphers
      }, options), handleCallback);
      socket.on('error', function(e) {
        if (!ciphers && util.isCiphersError(e)) {
          return getProxySocket(options, callback, util.getCipher(options._rules));
        } else {
          handleCallback(e);
        }
      });
    } catch (e) {
      handleCallback(e);
    }
  };
  var proxyOpts = options._proxyOptions;
  proxyOpts.proxyType === 'socks' ?
    getSocksSocket(options, handleConnect) :
      getTunnelSocket(options, handleConnect);
}

function getSocket(options, callback) {
  if (!options) {
    return callback();
  }
  var handleCallback = function(err, socket) {
    if (err) {
      return callback(false, null, err);
    }
    var proto = socket.alpnProtocol || socket.npnProtocol;
    callback(proto === 'h2', socket);
  };
  options._proxyOptions ?
    getProxySocket(options, handleCallback) :
      util.connect(addCert({
        servername: options.servername,
        host: options.host,
        port: options.port || 443,
        rejectUnauthorized: config.rejectUnauthorized,
        ALPNProtocols: SUPPORTED_PROTOS,
        NPNProtocols: SUPPORTED_PROTOS,
        _rules: options._rules
      }, options), handleCallback);
}

function getClient(req, socket, name) {
  var client = http2.connect('https://' + req.headers.host, {
    settings: H2_SETTINGS,
    maxSessionMemory: 128,
    rejectUnauthorized: config.rejectUnauthorized,
    createConnection: function() {
      return socket;
    }
  });
  clients[name] = client;
  client._updateTime = Date.now();
  var closed;
  var handleClose = function() {
    if (!closed) {
      closed = true;
      delete clients[name];
      client.close();
      socket.destroy();
    }
  };
  socket.on('error', handleClose);
  client.on('error', handleClose);
  socket.once('close', handleClose);
  client.once('close', handleClose);
  return client;
}

function requestH2(client, req, res, callback) {
  if (req.hasError) {
    return;
  }
  var headers = util.formatH2Headers(req.headers);
  delete req.headers.connection;
  delete req.headers['keep-alive'];
  delete req.headers['http2-settings'];
  delete req.headers['proxy-connection'];
  delete req.headers['transfer-encoding'];
  var options = req.options;
  var responsed;
  headers[':path'] = options.path;
  headers[':method'] = options.method;
  headers[':authority'] = req.headers.host;
  try {
    var h2Session = client.request(headers);
    if (req.noReqBody) {
      var errorHandler = function() {
        if (!responsed) {
          responsed = true;
          h2Session.destroy();
          callback();
        }
      };
      h2Session.on('error', errorHandler);
      h2Session.once('close', errorHandler);
    }
    h2Session.on('response', function(h2Headers) {
      if (responsed) {
        return;
      }
      responsed = true;
      var newHeaders = {};
      var statusCode = h2Headers[':status'];
      var svrRes = h2Session;
      svrRes.on('trailers', function(trailers) {
        svrRes.trailers = trailers;
      });
      svrRes.statusCode = statusCode;
      // HTTP2 对响应内容格式要求太严格（NGHTTP2_PROTOCOL_ERROR）
      if (!util.hasBody(svrRes, req)) {
        h2Session.destroy();
        svrRes = new PassThrough();
        svrRes.statusCode = statusCode;
        svrRes.push(null);
      }
      svrRes.httpVersion = '1.1';
      svrRes.headers = newHeaders;
      Object.keys(h2Headers).forEach(function(name) {
        if (name[0] !== ':' && name !== 'content-length' && name !== 'transfer-encoding') {
          newHeaders[name] = h2Headers[name];
        }
      });
      res.response(svrRes);
    });
    req.pipe(h2Session);
  } catch (e) {
    !responsed && callback();
    responsed = true;
  }
}

exports.getServer = function(options, listener) {
  var createServer;
  if (options.allowHTTP1 && http2) {
    createServer = http2.createSecureServer;
    options.maxSessionMemory = 128;
    options.settings = H2_SVR_SETTINGS;
  } else {
    createServer = https.createServer;
  }
  var server = createServer(options);
  if (typeof listener === 'function') {
    server.on('request', listener);
  } else if (listener) {
    Object.keys(listener).forEach(function(name) {
      server.on(name, listener[name]);
    });
  }
  return server;
};

function checkTlsError(err) {
  if (!err) {
    return true;
  }
  var code = err.code;
  if (typeof code !== 'string') {
    return false;
  }
  return code.indexOf('ERR_TLS_') === 0 || code.indexOf('ERR_SSL_') === 0;
}

/**
 * TODO(v2.0): 遗留两种需要处理的H2请求
 * 1. 设置代理后的请求
 * 2. 插件转发回来的请求
 */
exports.request = function(req, res, callback) {
  var options = req.useH2 && req.options;
  if (!options) {
    return callback();
  }
  var key = getKey(options);
  var name = req.clientIp + '\n' + key;
  var client = clients[name];
  if (client) {
    client.curIndex = client.curIndex ? ++client.curIndex % CONCURRENT : 1;
    if (client.curIndex) {
      name = name + '\n' + client.curIndex;
      client = clients[name];
    }
    if (client) {
      client._updateTime = Date.now();
      return requestH2(client, req, res, callback);
    }
  }
  var time = notH2.peek(key);
  if (time && (Date.now() - time < TIMEOUT || pendingH2[key])) {
    return callback();
  }
  pendingH2[key] = 1;
  var pendingItem = pendingList[name];
  if (pendingItem) {
    return pendingItem.push([req, res, callback]);
  }
  pendingItem = [[req, res, callback]];
  pendingList[name] = pendingItem;
  options._rules = req.rules;
  var proxyOpts = options._proxyOptions;
  if (proxyOpts) {
    proxyOpts.enableIntercept = true;
    proxyOpts.proxyTunnelPath = util.getProxyTunnelPath(req, true);
  }
  getSocket(options, function(isH2, socket, err) {
    if (socket) {
      socket.secureConnecting = false; // fix: node bug
    }
    client =isH2 && getClient(req, socket, name);
    delete pendingList[name];
    delete pendingH2[key];
    if (client) {
      notH2.del(key);
      pendingItem.forEach(function(list) {
        requestH2(client, list[0], list[1], list[2]);
      });
    } else {
      checkTlsError(err) && notH2.set(key, Date.now());
      pendingItem.forEach(function(list) {
        list[2](socket);
        socket = null;
      });
    }
  });
};
