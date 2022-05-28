var handleWebsocket = require('./https').handleWebsocket;
var hparser = require('hparser');
var net = require('net');
var Buffer = require('safe-buffer').Buffer;
var pluginMgr = require('./plugins');
var util = require('./util');
var config = require('./config');

var formatHeaders = hparser.formatHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;
var getRawHeaders = hparser.getRawHeaders;
var PLUGIN_PATH_RE =
  /^\/(\.\.\.whistle-path\.5b6af7b9884e1165\.\.\.\/\/\/)?(whistle|plugin)\.([^/?#]+)\/?/;

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
  var isUIPort = port == config.port || port == config.uiport;
  var isWebUI = isUIPort && util.isLocalHost(host);
  if (!isWebUI && (isWebUI = config.isWebUIHost(host)) && net.isIP(host)) {
    isWebUI = isUIPort;
  }
  var pluginName;
  var isPluginUrl;
  var internalPath;
  if (!config.pureProxy && PLUGIN_PATH_RE.test(req.url)) {
    internalPath = RegExp['$&'];
    req.isInternalUrl = !!RegExp.$1;
    isPluginUrl = RegExp.$2 === 'plugin';
    pluginName = RegExp.$3;
  } else if (!isWebUI) {
    pluginName =
      (isUIPort || !net.isIP(host)) && config.getPluginNameByHost(host);
  }
  if (!pluginName) {
    return callback();
  }
  var plugin = isPluginUrl
    ? pluginMgr.getPluginByName(pluginName)
    : pluginMgr.getPlugin(pluginName + ':');
  if (!isWebUI && !plugin) {
    return callback();
  }
  if (internalPath) {
    req.url = '/' + req.url.substring(internalPath.length);
  }
  pluginMgr.loadPlugin(plugin, function (err, ports) {
    var uiPort = ports && ports.uiPort;
    if (err || !uiPort) {
      var msg = [
        'HTTP/1.1',
        err ? 500 : 404,
        err ? 'Internal Server Error' : 'Not Found'
      ].join(' ');
      err = err ? '<pre>' + util.encodeHtml(err) + '</pre>' : 'Not Found';
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
  ++util.proc.allWsRequests;
  ++util.proc.totalAllWsRequests;
  var done, reqDestroyed, resDestroyed, resSocket;
  function destroy(err) {
    if (resSocket) {
      if (!resDestroyed) {
        resDestroyed = true;
        resSocket.destroy(err);
      }
    } else if (!reqDestroyed) {
      reqDestroyed = true;
      socket.destroy(err);
    }
    if (socket.isLogRequests) {
      --util.proc.wsRequests;
    }
    socket.isLogRequests = false;
    if (!done) {
      done = true;
      --util.proc.allWsRequests;
    }
  }
  var headers = req.headers;
  util.onSocketEnd(socket, destroy);
  util.addTunnelData(socket, headers);
  socket._clientId = util.getComposerClientId(headers);
  var getBuffer = function (method, newHeaders, path) {
    var rawData = [
      (method || 'GET') +
        ' ' +
        (path || socket.url || req.url) +
        ' ' +
        'HTTP/1.1'
    ];
    newHeaders = formatHeaders(newHeaders || headers, req.rawHeaders);
    rawData.push(getRawHeaders(newHeaders));
    return Buffer.from(rawData.join('\r\n') + '\r\n\r\n');
  };
  var sniPlugin = headers[config.SNI_PLUGIN_HEADER];
  if (sniPlugin) {
    socket.sniPlugin = req.sniPlugin = sniPlugin;
    delete headers[config.SNI_PLUGIN_HEADER];
  }
  req.isPluginReq = socket.isPluginReq = util.checkPluginReqOnce(req);
  util.handleForwardedProps(req);
  var isHttps = socket.isHttps || req.isHttps || !!headers[config.HTTPS_FIELD];
  req.isHttps = socket.isHttps = isHttps;
  // format headers
  req.isWs = true;
  socket.fullUrl = util.getFullUrl(req);
  socket._fwdHost = req._fwdHost;
  getPluginNameByReq(req, function (err, uiPort) {
    if (err) {
      return socket.write(err);
    }
    var clientInfo = util.parseClientInfo(req);
    var clientIp = clientInfo[0] || util.getClientIp(req);
    var clientPort = clientInfo[1] || util.getClientPort(req);
    socket._remoteAddr = clientInfo[2] || util.getRemoteAddr(req);
    socket._remotePort = clientInfo[3] || util.getRemotePort(req);
    delete headers[config.CLIENT_PORT_HEAD];
    if (uiPort) {
      headers[config.CLIENT_IP_HEAD] = clientIp;
      headers[config.CLIENT_PORT_HEAD] = clientPort;
      headers['x-whistle-remote-address'] = socket._remoteAddr;
      headers['x-whistle-remote-port'] = socket._remotePort;
      headers[config.PLUGIN_HOOK_NAME_HEADER] = config.PLUGIN_HOOKS.UI;
      socket.pause();
      util.connect(
        {
          port: uiPort || config.port,
          host: '127.0.0.1'
        },
        function (err, s) {
          resSocket = s;
          if (err || socket._hasError) {
            return destroy(err);
          }
          resSocket.on('error', destroy);
          resSocket.write(getBuffer(req.method));
          socket.pipe(resSocket).pipe(socket);
          socket.resume();
        }
      );
      return;
    }
    // 不能放到上面，否则转发后的协议将丢失
    delete headers[config.HTTPS_FIELD];
    socket.rawHeaderNames = getRawHeaderNames(req.rawHeaders);
    socket.headers = headers;
    socket.url = req.url;
    socket.fromTunnel = req.fromTunnel;
    socket.fromComposer = req.fromComposer;
    socket.enableXFF = req.enableXFF;
    socket.isInternalUrl = req.isInternalUrl;
    delete socket.headers[config.CLIENT_PORT_HEAD];
    socket.getBuffer = function (newHeaders, path) {
      return getBuffer(null, newHeaders, path);
    };
    handleWebsocket(socket, clientIp, clientPort);
  });
}

module.exports = function (server) {
  server.on('upgrade', upgradeHandler);
};
