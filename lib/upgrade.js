var handleWebsocket = require('./https').handleWebsocket;
var hparser = require('hparser');
var Buffer = require('safe-buffer').Buffer;
var pluginMgr = require('./plugins');
var util = require('./util');
var config = require('./config');

var formatHeaders = hparser.formatHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var getRawHeaders = hparser.getRawHeaders;
var WS_RE = /\bwebsocket\b/i;
var PLUGIN_PATH_RE = /^\/(whistle|plugin)\.([^/?#]+)(\/)?/;

function getPluginNameByReq(req, callback) {
  if (!req) {
    return callback();
  }
  var host = req.headers.host;
  var index = host.indexOf(':');
  var port = req.isHttps ? 443 : 80;
  if (index !== -1) {
    port = host.substring(index + 1);
    host = host.substring(0, index);
  }
  var isWebUI = (port == config.port || port == config.uiport) && util.isLocalAddress(host);
  isWebUI = isWebUI || config.isWebUIHost(host);
  var pluginName;
  var isPluginUrl;
  if (!isWebUI) {
    pluginName = config.getPluginNameByHost(host);
  } else if (PLUGIN_PATH_RE.test(req.url)) {
    isPluginUrl = RegExp.$1 === 'plugin';
    pluginName = RegExp.$2;
  }
  if (!pluginName) {
    return callback();
  }
  req.url = req.url.replace(PLUGIN_PATH_RE, '$3');
  if (req.url[0] !== '/') {
    req.url = '/' + req.url;
  }
  var plugin = isPluginUrl ? pluginMgr.getPluginByName(name) : pluginMgr.getPlugin(name + ':');
  pluginMgr.loadPlugin(plugin, function(err, ports) {
    var uiPort = ports && ports.uiPort;
    if (err || !uiPort) {
      var msg = ['HTTP/1.1', err ? 500 : 404, err ? 'Internal Server Error' : 'Not Found'].join(' ');
      err = err ? '<pre>' + err + '</pre>' : 'Not Found';
      var length = Buffer.byteLength(err);
      err = [
        msg,
        'Content-Type: text/html; charset=utf8',
        'Content-Length: ' + length,
        '\r\n',
        err
      ].join('\r\n');
    }
    callback(err, uiPort);
  });
}

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
  socket.headers = headers;
  req.isHttps = socket.isHttps = !!headers[config.HTTPS_FIELD];
  // format headers
  socket.fullUrl = util.getFullUrl(socket).replace('http', 'ws');
  var isWs = WS_RE.test(headers.upgrade);
  getPluginNameByReq(isWs ? req : null, function(err, uiPort) {
    if (err) {
      return socket.write(err);
    }
    // 其它协议直接转成普通https请求，方便抓包调试
    // 如果是插件的websocket请求，直接转插件
    if (!isWs || uiPort) {
      if (!isWs) {
        delete headers.upgrade;
        delete headers['http2-settings'];
        headers.connection = 'keep-alive';
      }
      req.pause();
      util.connect({
        port: uiPort || config.port,
        localhost: '127.0.0.1'
      }, function(err, s) {
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
  // 不能放到上面，否则转发后的协议将丢失
    delete headers[config.HTTPS_FIELD];
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
  });
}

module.exports = function(server) {
  server.on('upgrade', upgradeHandler);
};
