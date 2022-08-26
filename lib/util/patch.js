var EventEmitter = require('events').EventEmitter;
var PassThrough = require('stream').PassThrough;
var Socket = require('net').Socket;
var http = require('http');
var https = require('https');
var hparser = require('hparser');

var httpRequest = http.request;
var httpsRequest = https.request;
var res = http.OutgoingMessage.prototype;
var noop = function () {};
var INVALID_PATH_RE = /[^\u0021-\u00ff]/;
var INVALID_PATH_RE_G = /[^\u0021-\u00ff]/g;
var HOST_RE = /^host$/i;

process.emitWarning = noop;
//see: https://github.com/joyent/node/issues/9272
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var setHeader = res.setHeader;
res.setHeader = function (field, val) {
  try {
    return setHeader.call(this, field, val);
  } catch (e) {}
};

function listenerCount(emitter, eventName) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(eventName);
  }
  return EventEmitter.listenerCount(emitter, eventName);
}

exports.listenerCount = listenerCount;

var proto = Socket.prototype;
var destroy = proto.destroy;
var on = proto.on;
// 避免第三方模块没处理好异常导致程序crash
proto.destroy = function (err) {
  if (this.destroyed) {
    return;
  }
  if (err && !listenerCount(this, 'error')) {
    this.on('error', noop);
  }
  return destroy.call(this, err);
};
// 避免一些奇奇怪怪的异常，导致整个进程 crash
// 如：Error: This socket has been ended by the other party
var wrapOn = function () {
  var evt = arguments[0];
  if (this.on === wrapOn) {
    this.on = on;
  }
  if (evt !== 'error' && !listenerCount(this, 'error')) {
    on.call(this, 'error', noop);
  }
  return on.apply(this, arguments);
};
proto.on = wrapOn;

function filterInvalidPath(options) {
  if (!options) {
    return options;
  }
  if (typeof options === 'string') {
    if (INVALID_PATH_RE.test(options)) {
      return options.replace(INVALID_PATH_RE_G, '');
    }
  } else if (options.path && INVALID_PATH_RE.test(options.path)) {
    options.path = String(options.path).replace(INVALID_PATH_RE_G, '');
  }
  return options;
}

function hackRequest(requestFn, self, args, isApply) {
  var client;
  try {
    client = requestFn[isApply ? 'apply' : 'call'](self, args);
    var end = client.end;
    client.end = function () {
      try {
        end.apply(this, arguments);
      } catch (e1) {
        client.emit('error', e1);
      }
    };
  } catch (e2) {
    client = new PassThrough();
    process.nextTick(function () {
      client.emit('error', e2);
    });
  }
  return client.on('error', noop);
}

https.request = function () {
  return hackRequest(httpsRequest, this, arguments, true);
};

http.request = function (options) {
  var tunnelPath =
    options && options.method === 'CONNECT' && options.proxyTunnelPath;
  options = filterInvalidPath(options);
  if (!tunnelPath) {
    return hackRequest(httpRequest, this, arguments, true);
  }
  var client = hackRequest(httpRequest, this, options);
  var on = client.on;
  client.on = function (type, listener) {
    if (type !== 'connect') {
      return on.apply(this, arguments);
    }
    on.call(this, type, function (res, socket, head) {
      socket.on('error', noop);
      if (res.statusCode !== 200) {
        return listener.apply(this, arguments);
      }
      var headers = {};
      var isHost;
      if (options.headers) {
        isHost = options.headers.Host;
        Object.keys(options.headers).forEach(function(key) {
          if (!HOST_RE.test(key)) {
            headers[key] = options.headers[key];
          }
        });
      }
      headers[isHost ? 'Host' : 'host'] = tunnelPath;
      if (options.enableIntercept) {
        headers['x-whistle-policy'] = 'intercept';
        delete headers['X-Whistle-Policy'];
      }
      headers = hparser.getRawHeaders(headers);
      var rawData = [
        'CONNECT ' + tunnelPath + ' HTTP/1.1',
        headers,
        '\r\n'
      ].join('\r\n');
      if (res.statusCode === 200 && res.headers['x-whistle-allow-tunnel-ack']) {
        rawData = '1' + rawData;
      }
      socket.write(rawData);
      hparser.parse(
        socket,
        function (err, _res) {
          if (err) {
            return client.emit('error', err);
          }
          res.statusCode = parseInt(_res.statusCode, 10);
          res.headers = _res.headers;
          !options.keepStreamResume && socket.pause();
          listener.call(this, res, socket, head);
        },
        true
      );
    });
    return this;
  };
  return client;
};
