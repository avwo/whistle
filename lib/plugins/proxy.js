var net = require('net');
var http = require('http');
var extend = require('extend');
var { parse: parseUrl } = require('url');
var getServer = require('hagent').create(createServer, 51500);
var formatHeaders = require('hparser').formatHeaders;
var common = require('../util/common');

var createServer = net.createServer;
var CR_CODE = '\r'.charCodeAt();
var PROXY_ID_HEADER;
var proxyIp;
var proxyPort;

function toNumber(x) {
  x = Number(x);
  return x >= 0 ? x : false;
}

function isPipeName(s) {
  return typeof s === 'string' && toNumber(s) === false;
}

function normalizeArgs(args) {
  var arr;
  if (args.length === 0) {
    arr = [{}, null];
    return arr;
  }

  var arg0 = args[0];
  var options = {};
  if (typeof arg0 === 'object' && arg0 !== null) {
    // (options[...][, cb])
    options = arg0;
  } else if (isPipeName(arg0)) {
    // (path[...][, cb])
    options.path = arg0;
  } else {
    // ([port][, host][...][, cb])
    options.port = arg0;
    if (args.length > 1 && typeof args[1] === 'string') {
      options.host = args[1];
    }
  }

  var cb = args[args.length - 1];
  if (typeof cb !== 'function') { arr = [options, null]; } else { arr = [options, cb]; }

  return arr;
}

function createSocket(opts, cb) {
  var done;
  var client;
  var headers = common.lowerCaseify(opts.headers);
  var handleCb = function(err, socket, res) {
    if (!done) {
      done = true;
      cb && cb(err, socket, res);
    }
    if (err && client) {
      client.destroy();
      client = null;
    }
  };
  if (!headers['x-whistle-policy']) {
    if (opts.isHttp) {
      headers['x-whistle-policy'] = 'capture';
    } else {
      headers['x-whistle-policy'] = opts.isConnect ? 'connect' : 'tunnel';
    }
  }
  if (opts.isInternal) {
    headers[PROXY_ID_HEADER] = '1';
  }
  headers.host = opts.path;
  var clientIp = common.removeIPV6Prefix(opts.clientIp);
  var clientPort = opts.clientPort;
  if (clientIp && net.isIP(clientIp)) {
    headers['x-forwarded-for'] = clientIp;
  }
  if (clientPort > 0 && clientPort < 65536) {
    headers['x-whistle-client-port'] = clientPort;
  }
  headers['x-whistle-request-tunnel-ack'] = '1';
  client = http.request({
    host: proxyIp,
    port: proxyPort,
    method: 'CONNECT',
    agent: false,
    path: opts.path,
    headers: headers
  });
  client.once('connect', function(res, socket) {
    socket.on('error', handleCb);
    if (res.statusCode !== 200) {
      var err = new Error('Tunneling socket could not be established, statusCode=' + res.statusCode);
      err.statusCode = res.statusCode;
      socket.destroy();
      return handleCb(err);
    }
    if (res.headers['x-whistle-allow-tunnel-ack']) {
      socket.write('1');
    }
    handleCb(null, socket, res);
  });
  client.on('error', handleCb);
  client.end();
}

module.exports = function(options, cb) {
  PROXY_ID_HEADER = options.PROXY_ID_HEADER;
  proxyIp = options.proxyIp;
  proxyPort = options.proxyPort;

  getServer(function(server, port) {
    var tempServerOpts = {
      host: '127.0.0.1',
      port: port
    };
    server.on('connection', function(socket) {
      var destroyed;
      var sock;
      var destroy = function() {
        if (!destroyed) {
          destroyed = true;
          socket.destroy();
          sock && sock.destroy();
        }
      };
      var info;
      socket.on('data', function(chunk) {
        info = info ? Buffer.concat([info, chunk]) : chunk;
        if (info[info.length - 1] === CR_CODE) {
          socket.pause();
          socket.removeAllListeners('data');
          try {
            info = JSON.parse(info.toString().trim());
            if (!info && info.path) {
              return destroy();
            }
            createSocket(info, function(err, sock) {
              if (err) {
                return destroy();
              }
              sock.on('error', destroy);
              socket.pipe(sock).pipe(socket);
              socket.resume();
            });
          } catch (e) {
            destroy();
          }
        }
      });
    });
    var connect = function(opts) {
      var socket = net.connect(tempServerOpts);
      socket.write(JSON.stringify({
        path: opts.host + ':' + (opts.port || 80),
        isHttp: opts.isHttp,
        isConnect: opts.isConnect,
        isInternal: opts.isInternal,
        clientIp: opts.clientIp,
        clientPort: opts.clientPort,
        headers: opts.proxyHeaders
      }) + '\r');
      socket.on('error', common.noop);
      return socket;
    };
    var request = function(opts, cb) {
      if (typeof opts === 'string') {
        opts = { url: opts };
      } else {
        opts = extend({}, opts);
      }
      opts.url = common.setProtocol(opts.url);
      var uri = parseUrl(opts.url);
      var client;
      if (common.isConnect(uri)) {
        client = connect({
          host: uri.hostname,
          port: uri.port,
          headers: opts.proxyHeaders
        });
        client.isConnect = true;
        return client;
      }
      var protocol = uri.protocol;
      var isHttps = protocol === 'https:';
      var isHttp = isHttps || protocol === 'http:';
      var isWs = common.isWebSocket(uri, opts.headers);
      if (!isHttp && !isWs) {
        return cb && cb(new Error('Bad URL'));
      }
      var rawNames = {};
      var headers = common.lowerCaseify(opts.headers, rawNames);
      if (isWs) {
        headers.connection = 'Upgrade';
        headers.upgrade = 'websocket';
        rawNames.connection = 'Connection';
        rawNames.upgrade = 'Upgrade';
      }
      client = http.request({
        path: opts.url || '/',
        method: opts.method,
        agent: null,
        createConnection: function(sockOpts) {
          sockOpts = extend({}, sockOpts);
          sockOpts.isHttp = true;
          sockOpts.isConnect = opts.isConnect;
          sockOpts.isInternal = opts.isInternal;
          sockOpts.clientIp = opts.clientIp;
          sockOpts.clientPort = opts.clientPort;
          sockOpts.headers = opts.proxyHeaders;
          return connect(sockOpts);
        },
        headers: formatHeaders(headers, rawNames)
      }, cb);
      client.isHttp = isHttp;
      client.isWebSocket = isWs;
      return client;
    };
    cb({
      connect: connect,
      request: request
    });
  });
};
