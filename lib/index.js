var express = require('express');
var http = require('http');
var https = require('https');
var socks = require('sockx');
var extend = require('extend');
var EventEmitter = require('events');
var util = require('./util');
var logger = require('./util/logger');
var rules = require('./rules');
var setupHttps = require('./https').setup;
var httpsUtil = require('./https/ca');
var rulesUtil = require('./rules/util');
var initDataServer = require('./util/data-server');
var initLogServer = require('./util/log-server');
var pluginMgr = require('./plugins');
var config = require('./config');
var loadService = require('./service');
var initSocketMgr = require('./socket-mgr');
var tunnelProxy = require('./tunnel');
var upgradeProxy = require('./upgrade');
var proc = require('./util/process');
var perf = require('./util/perf');
var loadCert = require('./https/load-cert');
var common = require('./util/common');

function handleClientError(err, socket) {
  if (!socket.writable) {
    return socket.destroy(err);
  }
  var errCode = err && err.code;
  var statusCode = errCode === 'HPE_HEADER_OVERFLOW' ? 431 : 400;
  var stack = util.getErrorStack(
    'clientError: Bad request' + (errCode ? ' (' + errCode + ')' : '')
  );
  socket.end('HTTP/1.1 ' + statusCode + ' Bad Request\r\n\r\n' + stack);
}

function proxy(callback, _server) {
  var app = express();
  var server = _server || http.createServer();
  var proxyEvents = new EventEmitter();
  var middlewares = ['./init', '../biz']
    .concat(require('./inspectors'))
    .concat(config.middlewares)
    .concat(require('./handlers'));
  server.timeout = config.timeout;
  proxyEvents.config = config;
  proxyEvents.server = server;
  app.disable('x-powered-by');
  app.logger = logger;
  middlewares.forEach(function (mw) {
    mw && app.use((typeof mw == 'string' ? require(mw) : mw).bind(proxyEvents));
  });
  server.on('clientError', handleClientError);
  pluginMgr.setProxy(proxyEvents);
  perf.setProxy(proxyEvents);
  initSocketMgr(proxyEvents);
  setupHttps(server, proxyEvents);
  exportInterfaces(proxyEvents);
  tunnelProxy(server, proxyEvents);
  upgradeProxy(server);
  initDataServer(proxyEvents);
  initLogServer(proxyEvents);
  rulesUtil.setup(proxyEvents);
  var properties = rulesUtil.properties;
  if (config.disableAllRules) {
    properties.set('disabledAllRules', true);
  } else if (config.disableAllRules === false) {
    properties.set('disabledAllRules', false);
  }
  if (config.disableAllPlugins) {
    properties.set('disabledAllPlugins', true);
  } else if (config.disableAllPlugins === false) {
    properties.set('disabledAllPlugins', false);
  }
  if (config.allowMultipleChoice) {
    properties.set('allowMultipleChoice', true);
  } else if (config.allowMultipleChoice === false) {
    properties.set('allowMultipleChoice', false);
  }
  rulesUtil.addValues(config.values, config.replaceExistValue);
  rulesUtil.addRules(config.rules, config.replaceExistRule);
  config.debug && rules.disableDnsCache();
  var count = _server ? 1 : 2;
  var execCallback = function () {
    if (--count === 0) {
      process.whistleStarted = true;
      process.emit('whistleStarted');
      typeof callback === 'function' && callback.call(server, proxyEvents);
    }
  };
  !_server && util.getBoundIp(config.host, function (host) {
    util.checkPort(!config.INADDR_ANY && !host && config.port, function () {
      config.host = host;
      server.listen(config.port, host, execCallback);
    });
  });
  var createNormalServer = function (port, httpModule, opts) {
    if (!port) {
      return;
    }
    ++count;
    var optionServer = httpModule.createServer(opts);
    var isHttps = !!opts;
    proxyEvents[isHttps ? 'httpsServer' : 'httpServer'] = optionServer;
    optionServer.on('request', function (req, res) {
      req.isHttps = isHttps;
      app.handle(req, res);
    });
    optionServer.isHttps = isHttps;
    tunnelProxy(optionServer, proxyEvents, isHttps ? 1 : 2);
    upgradeProxy(optionServer);
    optionServer.on('clientError', handleClientError);
    util.getBoundIp(
      config[isHttps ? 'httpsHost' : 'httpHost'],
      function (host) {
        util.checkPort(!config.INADDR_ANY && !host && port, function () {
          optionServer.listen(port, host, execCallback);
        });
      }
    );
  };
  createNormalServer(config.httpPort, http);
  createNormalServer(
    config.httpsPort,
    https,
    extend(
      {
        SNICallback: function (servername, callback) {
          var curUrl = 'https://' + servername;
          loadCert(
            {
              isHttpsServer: true,
              fullUrl: curUrl,
              curUrl: curUrl,
              useSNI: true,
              headers: {},
              servername: servername,
              serverName: servername,
              commonName: httpsUtil.getDomain(servername)
            },
            function () {
              httpsUtil.SNICallback(servername, callback);
            }
          );
        }
      },
      httpsUtil.createCertificate('*.wproxy.org')
    )
  );
  if (config.socksPort) {
    ++count;
    var boundHost;
    var socksServer = socks.createServer(function (info, accept, deny) {
      var dstPort = info.dstPort;
      var dstAddr = info.dstAddr;
      var connPath = dstAddr + ':' + dstPort;
      var headers = { host: connPath };
      headers['x-whistle-server'] = 'socks';
      if (
        config.socksMode ||
        (dstPort != 80 &&
          dstPort != 443 &&
          (dstPort != config.port ||
            (!util.isLocalAddress(dstAddr) && !config.isLocalUIUrl(dstAddr))))
      ) {
        headers['x-whistle-policy'] = 'tunnel';
      }
      var client = http.request({
        method: 'CONNECT',
        agent: false,
        path: connPath,
        host: boundHost,
        port: config.port,
        headers: headers
      });
      var destroy = function () {
        if (client) {
          client.abort();
          client = null;
          deny();
        }
      };
      client.on('error', destroy);
      client.on('connect', function (res, socket) {
        socket.on('error', destroy);
        if (res.statusCode != 200) {
          return destroy();
        }
        var reqSock = accept(true);
        if (reqSock) {
          reqSock.pipe(socket).pipe(reqSock);
        } else {
          destroy();
        }
      });
      client.end();
    });
    proxyEvents.socksServer = socksServer;
    util.getBoundIp(config.socksHost, function (host) {
      boundHost = host || '127.0.0.1';
      util.checkPort(
        !config.INADDR_ANY && !host && config.socksPort,
        function () {
          socksServer.listen(config.socksPort, host, execCallback);
        }
      );
      socksServer.useAuth(socks.auth.None());
    });
  }
  require('../biz/init')(proxyEvents, function () {
    server.on('request', app);
    execCallback();
  });
  return proxyEvents;
}

function exportInterfaces(obj) {
  obj.getWhistlePath = common.getWhistlePath;
  obj.rules = rules;
  obj.util = util;
  obj.rulesUtil = rulesUtil;
  obj.rulesMgr = rules;
  obj.httpsUtil = httpsUtil;
  obj.pluginMgr = pluginMgr;
  obj.logger = logger;
  obj.loadService = loadService;
  obj.setAuth = config.setAuth;
  obj.setUIHost = config.setUIHost;
  obj.setPluginUIHost = config.setPluginUIHost;
  obj.socketMgr = initSocketMgr;
  obj.getRuntimeInfo = function () {
    return proc;
  };
  obj.getShadowRules = function () {
    return config.shadowRules;
  };
  obj.setShadowRules = function (shadowRules) {
    if (typeof shadowRules === 'string') {
      config.shadowRules = shadowRules;
      rulesUtil.parseRules();
    }
  };
  return obj;
}

function handleGlobalException(err) {
  var code = err && err.code;
  if (
    code === 'EPIPE' ||
    code === 'ERR_HTTP2_ERROR' ||
    code === 'ENETUNREACH' ||
    code === 'ERR_HTTP_TRAILER_INVALID' ||
    code === 'ERR_INTERNAL_ASSERTION' ||
    (err && /finishwrite/i.test(err.message))
  ) {
    return;
  }
  if (
    !err ||
    (code !== 'ERR_IPC_CHANNEL_CLOSED' && code !== 'ERR_IPC_DISCONNECTED')
  ) {
    var stack = util.getErrorStack(err);
    common.writeLogSync('\r\n' + stack + '\r\n');
    /*eslint no-console: "off"*/
    console.error(stack);
    if (
      typeof process.handleUncauthtWhistleErrorMessage === 'function' &&
      process.handleUncauthtWhistleErrorMessage(stack, err) === false
    ) {
      return;
    }
  }
  setTimeout(function () {
    process.exit(1);
  }, 360);
}

process.on('unhandledRejection', handleGlobalException);
process.on('uncaughtException', handleGlobalException);

rulesUtil.setPluginMgr(pluginMgr);
rulesUtil.parseRules();

module.exports = exportInterfaces(proxy);
