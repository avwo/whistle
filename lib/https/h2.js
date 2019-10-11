var https = require('https');
var LRU = require('lru-cache');
var util = require('../util');
var http2 = require('../config').enableH2 ? require('http2') : null;

var SUPPORTED_PROTOS = ['h2', 'http/1.1', 'http/1.0'];
var H2_SETTINGS = { enablePush: false , enableConnectProtocol: false };
var clients = {};
var notH2 = new LRU({max: 2560, maxAge: 36000});
var pendingList = {};

function getKey(options) {
  return [options.servername, options.host, options.port].join('\n');
}

function getSocket(options, callback) {
  if (!options) {
    return callback();
  }
  util.connect({
    servername: options.servername,
    host: options.host,
    port: options.port || 443,
    rejectUnauthorized: false,
    ALPNProtocols: SUPPORTED_PROTOS,
    NPNProtocols: SUPPORTED_PROTOS
  }, function(err, socket) {
    if (err) {
      return callback(false, null, err);
    }
    var proto = socket.alpnProtocol || socket.npnProtocol;
    callback(proto === 'h2', socket);
  });
}

function getClient(req, socket, name) {
  var client = http2.connect('https://' + req.headers.host, {
    setttings: H2_SETTINGS,
    rejectUnauthorized: false,
    createConnection: function() {
      return socket;
    }
  });
  clients[name] = client;
  var handleClose = function() {
    delete clients[name];
    client.close();
    socket.destroy();
  };
  socket.on('error', handleClose);
  socket.on('close', handleClose);
  client.on('error', handleClose);
  return client;
}

function requestH2(client, req, res) {
  if (req.hasError) {
    return;
  }
  var headers = util.formatH2Headers(req.headers);
  delete req.headers.connection;
  delete req.headers['keep-alive'];
  delete req.headers['http2-settings'];
  delete req.headers['proxy-connection'];
  delete req.headers['transfer-encoding'];
  headers[':path'] = req.url;
  headers[':method'] = req.method;
  headers[':authority'] = req.headers.host;
  try {
    var h2Session = client.request(headers);
    h2Session.on('error', util.noop);
    h2Session.on('response', function(h2Headers) {
      var newHeaders = {};
      h2Session.statusCode = h2Headers[':status'];
      h2Session.httpVersion = '1.1';
      h2Session.headers = newHeaders;
      Object.keys(h2Headers).forEach(function(name) {
        if (name[0] !== ':') {
          newHeaders[name] = h2Headers[name];
        }
      });
      res.response(h2Session);
    });
    req.pipe(h2Session);
  } catch (e) {
    client.emit('error', e);
  }
}

exports.getServer = function(options, listener) {
  var createServer;
  if (options.allowHTTP1 && http2) {
    createServer = http2.createSecureServer;
    options.setttings = H2_SETTINGS;
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
  if (!options || options._proxyPort) {
    return callback();
  }
  var key = getKey(options);
  var name = req.sessoinId + '\n' + key;
  var client = clients[name];
  if (!client) {
    if (notH2.peek(key)) {
      return callback();
    }
    var pendingItem = pendingList[name];
    if (pendingItem) {
      return pendingItem.push([req, res, callback]);
    } else {
      pendingList[name] = [[req, res, callback]];
    }
  }
  getSocket(client ? null : options, function(isH2, socket, err) {
    client = client || (isH2 && getClient(req, socket, name));
    var pendingItem = pendingList[name];
    delete pendingList[name];
    if (client) {
      notH2.del(key);
      if (pendingItem) {
        pendingItem.forEach(function(list) {
          requestH2(client, list[0], list[1]);
        });
      } else {
        requestH2(client, req, res);
      }
    } else {
      checkTlsError(err) && notH2.set(key, 1);
      if (pendingItem) {
        pendingItem.forEach(function(list) {
          list[2](socket);
          socket = null;
        });
      } else {
        callback(socket);
      }
    }
  });
};
