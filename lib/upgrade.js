var handleWebsocket = require('./https').handleWebsocket;
var hparser = require('hparser');
var Buffer = require('safe-buffer').Buffer;
var util = require('./util');
var config = require('./config');

var formatHeaders = hparser.formatHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var getRawHeaders = hparser.getRawHeaders;
var WS_RE = /\bwebsocket\b/i;

function upgradeHandler(req, socket) {
  var destroyed, resSocket;
  function destroy(err) {
    if (destroyed) {
      return;
    }
    destroyed = true;
    socket.destroy(err);
    resSocket && resSocket.destroy(err);
  }
  socket.on('error', destroy);

  var headers = req.headers;
  var getBuffer = function(method, newHeaders, path) {
    var rawData = [(method || 'GET') + ' ' + (path || req.url) + ' ' + 'HTTP/1.1'];
    newHeaders = formatHeaders(newHeaders || headers, req.rawHeaders);
    rawData.push(getRawHeaders(newHeaders));
    return Buffer.from(rawData.join('\r\n') + '\r\n\r\n');
  };
  // 其它协议直接转成普通https请求，方便抓包调试
  if (!WS_RE.test(headers.upgrade)) {
    delete headers.upgrade;
    delete headers['http2-settings'];
    headers.connection = 'keep-alive';
    req.pause();
    util.connect(config.port, function(err, s) {
      if (err) {
        return destroy(err);
      }
      resSocket = s;
      resSocket.on('error', destroy);
      resSocket.write(getBuffer(req.method));
      req.pipe(resSocket).pipe(socket).resume();
    });
    return;
  }
  socket.headers = headers;
  socket.rawHeaderNames = getRawHeaderNames(req.rawHeaders);
  socket.url = req.url;
  var clientInfo = util.parseClientInfo(req);
  var clientIp = clientInfo[0] || util.getClientIp(req);
  var clientPort = clientInfo[1] || util.getClientPort(req);
  delete socket.headers[config.CLIENT_PORT_HEAD];
  socket.getBuffer = function(newHeaders, path) {
    return getBuffer(null, newHeaders, path);
  };
  handleWebsocket(socket, clientIp, clientPort);
}

module.exports = function(server) {
  server.on('upgrade', upgradeHandler);
};
