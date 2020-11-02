var path = require('path');
var os = require('os');
var http = require('http');
var fs = require('fs');
var https = require('https');
var crypto = require('crypto');
var qs = require('querystring');
var LRU = require('lru-cache');
var httpAgent = http.Agent;
var httpsAgent = require('https').Agent;
var url = require('url');
var fse = require('fs-extra2');
var Buffer = require('safe-buffer').Buffer;
var extend = require('extend');
var pkgConf = require('../package.json');
var config = extend(exports, pkgConf);
var tunnel = require('hagent').agent;
var socks = require('sockx');
var ClientRequest = require('http').ClientRequest;

var emptyReq, customUIHost;
var customHostPluginMap = {};
var customPluginNameHost = {};
var WHISTLE_PLUGIN_RE = /^(?:whistle\.)?([a-z\d_\-]+)$/;
var CMD_RE = /^[\w]{1,12}(?:\s+-g)?$/;
var httpsAgents = new LRU({max: 360});
var socksAgents = new LRU({max: 100});
var version = process.version.substring(1).split('.');
var disableAgent = version[0] > 10;
var uid = Date.now() + '-' + process.pid + '-' + Math.floor(Math.random() * 10000);
var noop = function() {};
var LOCAL_UI_HOST_LIST = ['local.whistlejs.com', 'l.wproxy.cn', '1.wproxy.cn',
'local.wproxy.org', 'l.wproxy.org', '1.wproxy.org', 'rootca.pro'];
var variableProperties = ['encrypted', 'sockets', 'dataDirname', 'storage', 'baseDir', 'noGlobalPlugins', 'pluginsDataMap',
'username', 'password', 'debugMode', 'localUIHost', 'extra', 'rules', 'values', 'dnsCache', 'allowDisableShadowRules'];

config.rejectUnauthorized = false;
config.enableH2 = version[0] > 12 || (version[0] == 12 && version[1] >= 12);
config.ASSESTS_PATH = path.join(__dirname, '../assets');
config.WHISTLE_REQ_FROM_HEADER = 'x-whistle-request-from';
config.WHISTLE_POLICY_HEADER = 'x-whistle-policy';
config.CLIENT_IP_HEAD = 'x-forwarded-for';
config.HTTPS_FIELD = 'x-whistle-https-request';
config.HTTPS_PROTO_HEADER = 'x-forwarded-proto';
config.INTERNAL_ID = Date.now() + '/' + process.pid + '/' + Math.floor(Math.random() * 100000);
config.INTERNAL_ID_HEADER = '_x-whistle-internal-id';
config.DATA_ID = 'x-whistle-data-id' + '-' + uid;
config.PROXY_ID_HEADER = 'x-whistle-proxy-id-' + uid;
config.CLIENT_PORT_HEAD = 'x-whistle-client-port';
config.WEBUI_HEAD = 'x-forwarded-from-whistle-' + uid;
config.RES_RULES_HEAD = 'x-whistle-res-rules-' + uid;
config.CLIENT_INFO_HEAD = 'x-whistle-client-info-' + uid;
config.WEBUI_PATH = '/...whistle-path.5b6af7b9884e1165...///';
config.PREVIEW_PATH_RE = /\?\?\?WHISTLE_PREVIEW_CHARSET=([A-Z\d_-]+)\?\?\?$/;
config.PLUGIN_HOOK_NAME_HEADER = 'x-whistle-plugin-hook-name_';
config.CLIENT_ID_HEADER = 'x-whistle-client-id';
config.TUNNEL_DATA_HEADER = 'x-whistle-tunnel-data';
config.TEMP_CLIENT_ID_HEADER = 'x-whistle-client-id-' + uid;
config.TEMP_TUNNEL_DATA_HEADER = 'x-whistle-tunnel-data-' + uid;
config.ALPN_PROTOCOL_HEADER = 'x-whistle-alpn-protocol';
config.PLUGIN_HOOKS = {
  HTTP: 'http-' + uid,
  UI: 'ui-' + uid,
  TUNNEL: 'tunnel-' + uid,
  TUNNEL_RULES: 'tunnel-rules-' + uid,
  REQ_STATS: 'req-stats-' + uid,
  RES_STATS: 'res-stats-' + uid,
  REQ_RULES: 'req-rules-' + uid,
  RES_RULES: 'res-rules-' + uid,
  REQ_READ: 'req-read-' + uid,
  REQ_WRITE: 'req-write-' + uid,
  RES_READ: 'res-read-' + uid,
  RES_WRITE: 'res-write-' + uid,
  WS_REQ_READ: 'ws-req-read-' + uid,
  WS_REQ_WRITE: 'ws-req-write-' + uid,
  WS_RES_READ: 'ws-res-read-' + uid,
  WS_RES_WRITE: 'ws-res-write-' + uid,
  TUNNEL_REQ_READ: 'tunnel-req-read-' + uid,
  TUNNEL_REQ_WRITE: 'tunnel-req-write-' + uid,
  TUNNEL_RES_READ: 'tunnel-res-read-' + uid,
  TUNNEL_RES_WRITE: 'tunnel-res-write-' + uid
};

var KEEP_ALIVE_MSECS = 10000;
var CONN_TIMEOUT = 30000;

config.CONN_TIMEOUT = CONN_TIMEOUT;

function getHomedir() {
//默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

config.getHomedir = getHomedir;

function getWhistlePath() {
  return process.env.WHISTLE_PATH || path.join(getHomedir(), '.WhistleAppData');
}

function getDataDir(dirname) {
  var dir = path.join(getWhistlePath(), dirname || '.' + config.name);
  fse.ensureDirSync(dir);
  return dir;
}

config.baseDir = getDataDir();
config.SYSTEM_PLUGIN_PATH = path.join(getWhistlePath(), 'plugins');
config.CUSTOM_PLUGIN_PATH = path.join(getWhistlePath(), 'custom_plugins');
config.CUSTOM_CERTS_DIR = path.join(getWhistlePath(), 'custom_certs');
try {
  fse.ensureDirSync(config.CUSTOM_CERTS_DIR);
} catch (e) {}

exports.getWhistlePath = getWhistlePath;
exports.getDataDir = getDataDir;

try {
  var async_id_symbol = process.binding('async_wrap').async_id_symbol;
} catch (e) {}
var emptyHandle = {
  asyncReset: noop,
  getAsyncId: noop
};

function getEmptyReq() {
  if (!emptyReq) {
    emptyReq = new ClientRequest();
    emptyReq.on('error', noop);
  }
  return emptyReq;
}

function packHttpMessage() {
  if (!this._httpMessage) {
    emptyReq = getEmptyReq();
    emptyReq.socket = this;
    this._httpMessage = emptyReq;
  }
}
function packSocket(socket) {
  if (socket.listeners('close').indexOf(packHttpMessage) === -1) {
    socket.once('close', packHttpMessage);
  }
  return socket;
}
function createAgent(agentConfig, https) {
  var agent = new (https ? httpsAgent : httpAgent)(agentConfig);
  if (async_id_symbol) {
    var addRequest = agent.addRequest;
    agent.addRequest = function(req, options) {
      // fix: https://github.com/nodejs/node/issues/13539
      var freeSockets = this.freeSockets[this.getName(options)];
      if (freeSockets && freeSockets.length) {
        var socket = packSocket(freeSockets[0]);
        var handle = socket._handle;
        if (!handle) {
          socket._handle = emptyHandle;
        } else if (typeof handle.asyncReset !== 'function') {
          handle.asyncReset = noop;
        }
        var originalRef = socket.ref;
        socket.ref = function() {
          socket.ref = originalRef;
          if (socket._handle === emptyHandle) {
            delete socket._handle;
          } else if (socket._handle.asyncReset === noop) {
            delete socket._handle.asyncReset;
          }
          socket.ref();
        };
      }
      var onSocket = req.onSocket;
      req.onSocket = function(socket) {
        try {
          socket[async_id_symbol] = socket._handle.getAsyncId();
        } catch(e) {}
        packSocket(socket);
        onSocket.apply(this, arguments);
      };
      addRequest.apply(this, arguments);
    };
  }
  var createConnection = agent.createConnection;
  agent.createConnection = function() {
    var s = createConnection.apply(this, arguments);
    return packSocket(s);
  };
  return agent;
}

function capitalize(str) {
  return (str && str[0].toUpperCase()) + str.substring(1);
}

function getHttpsAgent(options, reqOpts) {
  var key = getCacheKey(options);
  var agent = httpsAgents.get(key);
  if (reqOpts) {
    var headers = options.headers || {};
    var proxyHeaders = {};
    Object.keys(headers).forEach(function(key) {
      var rawKey = key.split('-').map(capitalize).join('-');
      proxyHeaders[rawKey] = headers[key];
    });
    reqOpts._tunnelProxyHeaders = proxyHeaders;
  }
  if (!agent) {
    options.proxyAuth = options.auth;
    options.rejectUnauthorized = config.rejectUnauthorized;
    options.proxy = {
      host: options.proxyHost,
      port: options.proxyPort,
      enableIntercept: options.enableIntercept,
      keepStreamResume: options.keepStreamResume,
      proxyTunnelPath: options.proxyTunnelPath
    };
    var agentName = options.isHttps ? 'httpsOverHttp' : 'httpOverHttp';
    if (options.proxyServername) {
      options.proxy.servername = options.proxyServername;
      agentName += 's';
    }
    agent = new tunnel[agentName](options);
    httpsAgents.set(key, agent);
    agent.on('free', preventThrowOutError);
    var createSocket = agent.createSocket;
    agent.createSocket = function(opts, cb) {
      createSocket.call(this, opts, function(socket) {
        packSocket(socket);
        cb(socket);
      });
    };
  }
  return agent;
}

exports.getHttpsAgent = getHttpsAgent;

function getCacheKey(options, isSocks) {
  var auth = options.auth || options.proxyAuth || '';
  var ip = (!isSocks && options.clientIp) || '';
  return [options.proxyServername ? 'https-proxy' : '', options.isHttps ? 'https' : 'http',
    options.proxyHost, options.proxyPort, auth, ip, options.proxyTunnelPath || '', (options.isHttps && options.cacheKey) || ''].join(':');
}

function getAuths(_url) {
  var options = typeof _url == 'string' ? url.parse(_url) : _url;
  if (!options || !options.auth) {
    return [socks.auth.None()];
  }

  var auths = [];
  options.auth.split('|').forEach(function(auth) {
    auth = auth.trim();
    if (auth) {
      var index = auth.indexOf(':');
      auths.push({
        username: index == -1 ? auth : auth.substring(0, index),
        password: index == -1 ? '' : auth.substring(index + 1)
      });
    }
  });

  return auths.length ? auths.map(function(auth) {
    return socks.auth.UserPassword(auth.username, auth.password);
  }) : [socks.auth.None()];
}


exports.getAuths = getAuths;

exports.setAuth = function(auth) {
  if (auth) {
    config.username = getString(auth.username);
    var password = config.password = getString(auth.password);
    config.passwordHash = password && createHash(password);
    setGuestAuth(auth);
  }
  return config;
};

exports.getPluginData = function(name) {
  var pluginsDataMap = name && config.pluginsDataMap;
  if (!pluginsDataMap) {
    return;
  }
  var index = name.indexOf('whistle.');
  if (index !== -1) {
    name = name.substring(index + 8);
  }
  return pluginsDataMap[name];
};

exports.setGuestAuth = function(auth) {
  auth && setGuestAuth(auth);
};

function parseHost(host) {
  if (Array.isArray(host)) {
    return host.filter(function(h) {
      return h && typeof h === 'string';
    });
  }
  host = typeof host === 'string' ? host.trim() : '';
  return host && host.split('|').map(getHostname);
}

exports.setUIHost = function(host) {
  customUIHost = parseHost(host);
};

exports.setPluginUIHost = function(pluginName, host) {
  if (!pluginName || !WHISTLE_PLUGIN_RE.test(pluginName)) {
    return;
  }
  pluginName = RegExp.$1;
  host = parseHost(host);
  if (host) {
    customPluginNameHost[pluginName] = host;
    host.forEach(function(h) {
      delete customHostPluginMap[h];
    });
  } else {
    delete customPluginNameHost[pluginName];
  }
  customHostPluginMap = {};
  Object.keys(customPluginNameHost).forEach(function(name) {
    var list = customPluginNameHost[name];
    list && list.forEach(function(h) {
      customHostPluginMap[h] = name;
    });
  });
};

function toBuffer(buf) {
  if (buf == null || Buffer.isBuffer(buf)) {
    return buf;
  }
  buf += '';
  return Buffer.from(buf);
}

exports.toBuffer = toBuffer;

function setHeader(headers, name, value) {
  var keys = Object.keys(headers);
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i];
    if (key.toLowerCase() === name) {
      headers[key] = value;
      return;
    }
  }
  headers[name] = value;
}

exports.setHeader = setHeader;

function getTunnelPath(headers) {
  var host = headers.host || headers.Host;
  if (host) {
    return host;
  }
  var keys = Object.keys(headers);
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i];
    if (key.toLowerCase() === 'host') {
      return headers[key];
    }
  }
}

function connect(options, cb) {
  var headers = options.headers || {};
  var proxyOptions = {
    method: 'CONNECT',
    agent: false,
    proxyTunnelPath: options.proxyTunnelPath,
    enableIntercept: options.enableIntercept,
    path: getTunnelPath(headers),
    host: options.proxyHost,
    port: options.proxyPort,
    rejectUnauthorized: config.rejectUnauthorized,
    headers: headers
  };
  var httpModule = http;
  if (options.proxyServername) {
    proxyOptions.servername = options.proxyServername;
    httpModule = https;
  }
  var auth = options.proxyAuth || options.auth;
  if (auth) {
    auth = 'Basic ' + toBuffer(auth).toString('base64');
    setHeader(headers, 'proxy-authorization', auth);
  }
  var timer = setTimeout(function() {
    if (req) {
      req.emit('error', new Error('Timeout'));
      req.abort();
    }
  }, CONN_TIMEOUT);
  var req = httpModule.request(proxyOptions);
  req.on('connect', function(res, socket) {
    clearTimeout(timer);
    socket.on('error', noop);
    if (res.statusCode !== 200) {
      var err = new Error('Tunneling socket could not be established, statusCode=' + res.statusCode);
      err.statusCode = res.statusCode;
      socket.destroy();
      process.nextTick(function() {
        req.emit('error', err);
      });
      return;
    }
    cb(socket, res);
  }).end();
  return req;
}

exports.connect = connect;

function preventThrowOutError(socket) {
  if (socket.listeners('error').indexOf(freeSocketErrorListener) === -1) {
    socket.once('error', freeSocketErrorListener);
  }
}

function freeSocketErrorListener() {
  var socket = this;
  socket.destroy();
  socket.emit('agentRemove');
  socket.removeListener('error', freeSocketErrorListener);
}

function resolvePath(file) {
  if (!file || !(file = file.trim())) {
    return file;
  }

  return /^[\w-]+$/.test(file) ? file : path.resolve(file);
}

function getHostname(_url) {
  if (typeof _url != 'string') {
    return '';
  }
  if (_url.indexOf('/') != -1) {
    return url.parse(_url).hostname;
  }
  var index = _url.indexOf(':');
  return index == -1 ? _url : _url.substring(0, index);
}

function getPaths(paths) {
  if (typeof paths === 'string') {
    paths = paths.trim().split(/\s*[|,;]\s*/);
  } else if (!Array.isArray(paths)) {
    return;
  }
  paths = paths.filter(function(path) {
    return path && typeof path === 'string';
  });
  return paths.length ? paths : null;
}

function getSecureFilter(newConf) {
  var secureFilter = newConf.secureFilter;
  if (typeof secureFilter === 'function') {
    return secureFilter;
  }
  if (!secureFilter || typeof secureFilter !== 'string') {
    return;
  }
  try {
    return require(secureFilter);
  } catch (e) {}
}

function getString(str) {
  return str && typeof str === 'string' ? str : '';
}

function createHash(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

function isPort(port) {
  return /^\d+$/.test(port) && port > 0;
}

function setGuestAuth(auth) {
  if (auth.guestName === '-' && !auth.guestPassword) {
    config.guest = {};
  } else if (auth.guestName && auth.guestPassword) {
    config.guest = {
      username: auth.guestName,
      password: auth.guestPassword
    };
  } else if ('guest' in auth) {
    config.guest = auth.guest;
  }
}

function parseString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  try {
    var data = JSON.parse(str);
    if (typeof data === 'string') {
      return data;
    }
  } catch (e) {}
  return str;
}

function getPluginList(list) {
  if (typeof list == 'string') {
    list = list.trim().split(/\s*[,|]\s*/);
  }
  var result;
  if (Array.isArray(list)) {
    list.forEach(function(name) {
      if (WHISTLE_PLUGIN_RE.test(name)) {
        result = result || [];
        result.push(RegExp.$1);
      } 
    });
  }
  return result;
}

exports.extend = function(newConf) {
  config.pluginHostMap = {};
  config.uiport = config.port;
  if (newConf) {
    config.shadowRules = parseString(newConf.shadowRules).trim();
    config.uiMiddleware = newConf.uiMiddleware;
    if (newConf.cmdName && CMD_RE.test(newConf.cmdName)) {
      config.cmdName = newConf.cmdName;
    }
    config.allowPluginList = getPluginList(newConf.allowPluginList);
    config.blockPluginList = getPluginList(newConf.blockPluginList);

    var projPaths = newConf.projectPluginPaths || newConf.projectPluginPath;
    if (Array.isArray(projPaths)) {
      config.projectPluginPaths = projPaths;
    }
    var customPaths = newConf.customPluginPaths || newConf.customPluginPath;
    if (Array.isArray(customPaths)) {
      config.customPluginPaths = customPaths;
    }
    if (newConf.inspect || newConf.inspectBrk) {
      config.inspectMode = true;
      process.env.PFORK_MODE = 'inline';
    }
    variableProperties.forEach(function(name) {
      config[name] = newConf[name] || pkgConf[name];
    });
    var extra = newConf.extra;
    if (extra && typeof extra === 'string') {
      extra = /^\s*\{[\w\W]*\}\s*$/.test(extra) ? extra : readFileText(extra);
      try {
        extra = extra && JSON.parse(extra);
        if (extra && typeof extra === 'object') {
          config.pluginsDataMap = extend({}, config.pluginsDataMap, extra);
        }
      } catch (e) {}
      extra = null;
    }
    var customHandler = newConf.customHandler || newConf.customHandle;
    if (typeof customHandler === 'function') {
      config.customHandler = customHandler;
    }
    if (isPort(newConf.port)) {
      config.uiport = config.port = newConf.port;
    }
    if (isPort(newConf.realPort) && config.realPort != config.port) {
      config.realPort = newConf.realPort;
    }
    if (isPort(newConf.uiport)) {
      config.customUIPort = newConf.uiport != config.port;
      config.uiport = newConf.uiport;
    }
    if (isPort(newConf.socksPort)) {
      config.socksPort = newConf.socksPort;
    }
    if (isPort(newConf.httpPort)) {
      config.httpPort = newConf.httpPort;
    }
    if (isPort(newConf.httpsPort)) {
      config.httpsPort = newConf.httpsPort;
    }
    config.addon = getPaths(newConf.addon);
    if (newConf.host && typeof newConf.host === 'string') {
      config.host = newConf.host;
    }

    if (typeof newConf.authKey === 'string') {
      config.authKey = newConf.authKey;
    }
    if (typeof newConf.guestAuthKey === 'string') {
      config.guestAuthKey = newConf.guestAuthKey;
    }
    if (newConf.reqCacheSize > 0) {
      config.reqCacheSize = newConf.reqCacheSize;
    }
    if (newConf.frameCacheSize > 0) {
      config.frameCacheSize = newConf.frameCacheSize;
    }
    config.allowMultipleChoice = newConf.allowMultipleChoice;
    if (typeof newConf.mode === 'string') {
      var mode = newConf.mode.trim().split('|');
      mode.forEach(function(m) {
        if (/^(pureProxy|debug|nohost|strict|multiEnv|multienv|encrypted|noGzip|disableUpdateTips|proxifier2?)$/.test(m)) {
          config[m] = true;
          if (m === 'nohost' || m === 'multienv') {
            config.multiEnv = true;
          }
        } else if (m === 'useMultipleRules' || m === 'enableMultipleRules') {
          config.allowMultipleChoice = true;
        } else if (m === 'disableMultipleRules') {
          config.allowMultipleChoice = false;
        } else if (m === 'classic') {
          config.classic = true;
        } else if (m === 'notAllowDisableRules' || m === 'notAllowedDisableRules') {
          config.notAllowedDisableRules = true;
        } else if (m === 'notAllowDisablePlugins' || m === 'notAllowedDisablePlugins') {
          config.notAllowedDisablePlugins = true;
        } else if (m === 'socks') {
          config.socksMode = true;
        } else if (m === 'network') {
          config.networkMode = true;
        } else if (m === 'plugins') {
          config.pluginsMode = true;
        } else if (m === 'rules') {
          config.rulesMode = true;
        } else if (m === 'httpProxy') {
          config.pureProxy = true;
        } else if (m === 'keepXFF') {
          config.keepXFF = true;
        } else if (m === 'INADDR_ANY') {
          config.INADDR_ANY = true;
        } else if (m === 'buildIn' || m === 'build-in') {
          process.env.PFORK_EXEC_PATH = process.execPath;
        } else if (m === 'safe' || m === 'rejectUnauthorized') {
          config.rejectUnauthorized = true;
        } else if (['capture', 'intercept', 'enable-capture', 'enableCapture'].indexOf(m) !== -1) {
          config.isEnableCapture = true;
        } else if (['disable-capture', 'disableCapture'].indexOf(m) !== -1) {
          config.isEnableCapture = false;
        } else if (['http2', 'enable-http2', 'enableHttp2', 'enable-h2', 'enableH2'].indexOf(m) !== -1) {
          config.isEnableHttp2 = true;
        } else if (['disable-http2', 'disableHttp2', 'disable-h2', 'disableH2'].indexOf(m) !== -1) {
          config.isEnableHttp2 = false;
        } else if (m === 'hideLeftBar' || m === 'hideLeftMenu') {
          config.hideLeftMenu = true;
        }
      });
      if (config.networkMode) {
        delete config.rulesMode;
        delete config.pluginsMode;
      } else if (config.rulesMode) {
        delete config.pluginsMode;
        delete config.networkMode;
      }
    }
    if (/^\d+$/.test(newConf.timeout)) {
      config.timeout = +newConf.timeout;
    } else if (config.strict) {
      config.timeout = 1000 * 60 * 6;
    }

    setGuestAuth(newConf);
    config.disableAllRules = newConf.disableAllRules;
    config.disableAllPlugins = newConf.disableAllPlugins;
    if (newConf.replaceExistRule === false) {
      config.replaceExistRule = false;
    } else {
      config.replaceExistValue = newConf.replaceRules;
    }
    if (newConf.replaceExistValue === false) {
      config.replaceExistValue = false;
    } else {
      config.replaceExistValue = newConf.replaceValues;
    }
    if (newConf.certDir && typeof newConf.certDir === 'string') {
      config.certDir = newConf.certDir;
    }

    if (typeof newConf.middlewares == 'string') {
      config.middlewares = newConf.middlewares.trim().split(/\s*,\s*/g);
    }
    var secureFilter = getSecureFilter(newConf);
    if (typeof secureFilter === 'function') {
      config.secureFilter = secureFilter;
    }
    config.pluginPaths = getPaths(newConf.pluginPaths || newConf.pluginsPath);
    var pluginHost = newConf.pluginHost;
    if (typeof pluginHost === 'string' && (pluginHost = pluginHost.trim())) {
      pluginHost = qs.parse(pluginHost);
      Object.keys(pluginHost).forEach(function(name) {
        var host = pluginHost[name];
        if (typeof host === 'string' && (host = host.trim())) {
          host = host.toLowerCase().split(/[|,&]/g);
          host.forEach(function(h) {
            config.pluginHostMap[h] = name;
          });
        }
      });
    }
  }

  if (!config.authKey) {
    config.authKey = 'auto_' + (Date.now() + Math.random().toFixed(6));
  }
  config.middlewares = Array.isArray(config.middlewares) ? config.middlewares.map(resolvePath) : [];
  var uiHostList = config.uiHostList = [];
  if (typeof config.localUIHost === 'string') {
    var localHostList = config.localUIHost.toLowerCase().split(/[|,&]/g);
    localHostList.forEach(function(hostname) {
      hostname = getHostname(hostname);
      if (hostname && LOCAL_UI_HOST_LIST.indexOf(hostname) == -1) {
        uiHostList.push(hostname);
      }
    });
    LOCAL_UI_HOST_LIST.push.apply(LOCAL_UI_HOST_LIST, uiHostList);
    // 兼容老版本
    config.customLocalUIHost = uiHostList[0];
  }

  config.setLocalUIHost = function(hostname) {
    config.customLocalUIHost = getHostname(hostname);
  };
  
  config.localUIHost = 'local.whistlejs.com';

  function readFileText(filepath) {
    try {
      return fs.readFileSync(filepath, { encoding: 'utf8' }).trim();
    } catch(e) {}
  }

  var isWebUIHost = function(host) {
    if (host === 'local.wproxy.org' || uiHostList.indexOf(host) !== -1 || (customUIHost && customUIHost.indexOf(host) !== -1)) {
      return true;
    }
    if (config.pureProxy) {
      return false;
    }
    return LOCAL_UI_HOST_LIST.indexOf(host) !== -1;
  };
  var isLocalUIUrl = function(url) {
    var host = getHostname(url);
    return isWebUIHost(host) || !!config.pluginHostMap[host] || !!customHostPluginMap[host];
  };
  config.isLocalUIUrl = isLocalUIUrl;
  exports.isWebUIHost = isWebUIHost;
  exports.getPluginNameByHost = function(host) {
    host = getHostname(host);
    if (isWebUIHost(host)) {
      return;
    }
    return config.pluginHostMap[host] || customHostPluginMap[host];
  };

  config.sockets = Math.max(parseInt(config.sockets, 10) || 0, 1);
  if (config.strict) {
    config.sockets = Math.max(config.sockets, 360);
  }
  var agentConfig = {
    maxSockets: config.sockets,
    keepAlive: true,
    keepAliveMsecs: KEEP_ALIVE_MSECS,
    maxFreeSockets: 0
  };
  // node 11及以上版本缓存连接有问题，先禁掉
  disableAgent = disableAgent || config.debug;
  config.httpAgent = disableAgent ? false : createAgent(agentConfig);
  config.httpsAgent = disableAgent ? false : createAgent(agentConfig, true);
  config.getSocksAgent = function(options) {
    var key = getCacheKey(options, true);
    var agent = socksAgents.get(key);
    if (agent) {
      return agent;
    }
    extend(options, agentConfig);
    options.proxyPort = parseInt(options.proxyPort, 10) || 1080;
    options.rejectUnauthorized = config.rejectUnauthorized;
    options.localDNS = false;
    options.auths = getAuths(options);
    agent = options.isHttps ? new socks.HttpsAgent(options) : new socks.HttpAgent(options);
    socksAgents.set(key, agent);
    agent.on('free', preventThrowOutError);
    return agent;
  };
  var baseDir = config.baseDir ? path.resolve(config.baseDir, config.dataDirname) : getDataDir(config.dataDirname);
  var customDirs = path.join(baseDir, 'custom_dirs');
  config.baseDir = baseDir;
  config.storage = config.storage && encodeURIComponent(config.storage);
  if (config.storage) {
    baseDir = path.join(customDirs, config.storage);
  }
  fse.ensureDirSync(baseDir);
  config.baseDirHash = createHash(baseDir);
  if (config.password) {
    config.passwordHash = createHash(config.password);
  }
  config.rulesDir = path.join(baseDir, 'rules');
  config.valuesDir = path.join(baseDir, 'values');
  config.propertiesDir = path.join(baseDir, 'properties');
  if (config.storage && newConf.copy) {
    var copyDir = typeof newConf.copy == 'string' && encodeURIComponent(newConf.copy);
    if (copyDir !== config.storage) {
      var dataDir = copyDir ? path.join(customDirs, copyDir) : config.baseDir;
      var rulesDir = path.join(dataDir, 'rules');
      var valuesDir = path.join(dataDir, 'values');
      var propsDir = path.join(dataDir, 'properties');
      fse.ensureDirSync(rulesDir);
      fse.ensureDirSync(valuesDir);
      fse.ensureDirSync(propsDir);
      fse.copySync(rulesDir, config.rulesDir);
      fse.copySync(valuesDir, config.valuesDir);
      fse.copySync(propsDir, config.propertiesDir);
    }
  }
  var clientIdFile = path.join(config.baseDir, '.clientid');
  var clientId = readFileText(clientIdFile);
  if (!clientId) {
    clientId = [Date.now(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random()].join();
    fs.writeFileSync(clientIdFile, clientId);
  }
  config.clientId = clientId;
  config.LOCAL_FILES = path.join(config.baseDir, 'local_files');
  fse.ensureDirSync(config.LOCAL_FILES);
  config.setModified = function(clientId, isRules) {
    if (isRules) {
      config.mrulesClientId = clientId || '';
      config.mrulesTime = Date.now();
    } else {
      config.mvaluesClientId = clientId || '';
      config.mvaluesTime = Date.now();
    }
  };
  return config;
};
