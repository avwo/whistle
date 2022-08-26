var path = require('path');
var http = require('http');
var fs = require('fs');
var net = require('net');
var dns = require('dns');
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
var tunnel = require('hagent').agent;
var socks = require('sockx');
var json5 = require('json5');
var pkgConf = require('../package.json');
var config = extend(exports, pkgConf);
var common = require('./util/common');

var customUIHost;
var customHostPluginMap = {};
var customPluginNameHost = {};
var WHISTLE_PLUGIN_RE = /^(?:whistle\.)?([a-z\d_\-]+)$/;
var CMD_RE = /^[\w]{1,12}(?:\s+-g)?$/;
var httpsAgents = new LRU({ max: 360 });
var socksAgents = new LRU({ max: 100 });
var version = process.version.substring(1).split('.');
var disableAgent = version[0] > 10;
var uid =
  Date.now() + '-' + process.pid + '-' + Math.floor(Math.random() * 10000);
var IPV4_RE = /^([\d.]+)(:\d{1,5})?$/;
var IPV6_RE = /^\[([\w:]+)\](:\d{1,5})?$/;
var noop = function () {};
var DATA_KEY_RE = /^(clientip|clientid|tunneldata)([=.])([\w.-]+)$/i;
var LOCAL_UI_HOST_LIST = [
  'local.whistlejs.com',
  'local.wproxy.org',
  'l.wproxy.org',
  'rootca.pro'
];
var variableProperties = [
  'encrypted',
  'sockets',
  'dataDirname',
  'storage',
  'baseDir',
  'noGlobalPlugins',
  'pluginsDataMap',
  'globalData',
  'username',
  'password',
  'debugMode',
  'localUIHost',
  'extra',
  'rules',
  'values',
  'dnsCache',
  'allowDisableShadowRules'
];

config.uid = uid;
config.rejectUnauthorized = false;
config.enableH2 = version[0] > 12; // 支持 HTTP2 要求的最低 Node 版本
config.ASSESTS_PATH = path.join(__dirname, '../assets');
config.REQ_FROM_HEADER = 'x-whistle-request-from';
config.WHISTLE_POLICY_HEADER = 'x-whistle-policy';
config.CUSTOM_CERT_HEADER = 'x-whistle-exists-custom-cert';
config.ENABLE_CAPTURE_HEADER = 'x-whistle-enable-capture';
config.CLIENT_IP_HEAD = 'x-forwarded-for';
config.HTTPS_FIELD = 'x-whistle-https-request';
config.HTTPS_PROTO_HEADER = 'x-forwarded-proto';
config.REAL_HOST_HEADER = 'x-whistle-real-host';
config.FWD_HOST_HEADER = 'x-forwarded-host';
config.INTERNAL_ID =
  Date.now() + '/' + process.pid + '/' + Math.floor(Math.random() * 100000);
config.INTERNAL_ID_HEADER = '_x-whistle-internal-id';
config.SNI_PLUGIN_HEADER = 'x-whistle-sni-callback-plugin-' + uid;
config.PROXY_ID_HEADER = 'x-whistle-proxy-id-' + uid;
config.CLIENT_PORT_HEAD = 'x-whistle-client-port';
config.WEBUI_HEAD = 'x-forwarded-from-whistle-' + uid;
config.RES_RULES_HEAD = 'x-whistle-res-rules-' + uid;
config.CLIENT_INFO_HEAD = 'x-whistle-client-info-' + uid;
config.REMOTE_ADDR_HEAD = 'x-whistle-remote-address-' + uid;
config.REMOTE_PORT_HEAD = 'x-whistle-remote-port-' + uid;
config.WEBUI_PATH = '/.whistle-path.5b6af7b9884e1165/';
config.PREVIEW_PATH_RE = /\?\?\?WHISTLE_PREVIEW_CHARSET=([A-Z\d_-]+)\?\?\?$/;
config.PLUGIN_HOOK_NAME_HEADER = 'x-whistle-plugin-hook-name_';
config.CLIENT_ID_HEADER = 'x-whistle-client-id';
config.CLIENT_ID_HEAD = 'x-whistle-client-id';
config.COMPOSER_CLIENT_ID_HEADER = 'x-whistle-client-id-' + uid;
config.TUNNEL_DATA_HEADER = 'x-whistle-tunnel-data';
config.TEMP_TUNNEL_DATA_HEADER = 'x-whistle-tunnel-data-' + uid;
config.UPGRADE_HEADER = 'x-whistle-upgrade-' + uid;
config.SNI_TYPE_HEADER = 'x-whistle-sni-type-' + uid;
config.ALPN_PROTOCOL_HEADER = 'x-whistle-alpn-protocol';
config.PLUGIN_HOOKS = {
  SNI: 'sni-' + uid,
  AUTH: 'auth-' + uid,
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

var getHomedir = common.getHomedir;
var getHomePath = common.getHomePath;
var getWhistlePath = common.getWhistlePath;

config.getHomedir = getHomedir;
config.getHomePath = getHomePath;

function getDataDir(dirname) {
  var dir = path.join(getWhistlePath(), dirname || '.' + config.name);
  fse.ensureDirSync(dir);
  return dir;
}

config.baseDir = getDataDir();
config.CUSTOM_PLUGIN_PATH = path.join(getWhistlePath(), 'custom_plugins');
config.CUSTOM_CERTS_DIR = path.resolve(getWhistlePath(), 'custom_certs');
config.DEV_PLUGINS_PATH = path.resolve(getWhistlePath(), 'dev_plugins');

try {
  fse.ensureDirSync(config.CUSTOM_CERTS_DIR);
} catch (e) {}

exports.getWhistlePath = getWhistlePath;
exports.getDataDir = getDataDir;
var async_id_symbol;
if (version[0] < 16) {
  try {
    async_id_symbol = process.binding('async_wrap').async_id_symbol;
  } catch (e) {}
}
var emptyHandle = {
  asyncReset: noop,
  getAsyncId: noop
};

function createAgent(agentConfig, https) {
  var agent = new (https ? httpsAgent : httpAgent)(agentConfig);
  if (async_id_symbol) {
    var addRequest = agent.addRequest;
    agent.addRequest = function (req, options) {
      // fix: https://github.com/nodejs/node/issues/13539
      var freeSockets = this.freeSockets[this.getName(options)];
      if (freeSockets && freeSockets.length) {
        var socket = freeSockets[0];
        var handle = socket._handle;
        if (!handle) {
          socket._handle = emptyHandle;
        } else if (typeof handle.asyncReset !== 'function') {
          handle.asyncReset = noop;
        }
        var originalRef = socket.ref;
        socket.ref = function () {
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
      req.onSocket = function (socket) {
        try {
          socket[async_id_symbol] = socket._handle.getAsyncId();
        } catch (e) {}
        onSocket.apply(this, arguments);
      };
      addRequest.apply(this, arguments);
    };
  }
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
    Object.keys(headers).forEach(function (key) {
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
  }
  return agent;
}

exports.getHttpsAgent = getHttpsAgent;

function getCacheKey(options, isSocks) {
  var auth = options.auth || options.proxyAuth;
  if (!auth) {
    var headers = options.headers || '';
    auth = headers['proxy-authorization'] || '';
  }
  var ip = (!isSocks && options.clientIp) || '';
  return [
    options.proxyServername ? 'https-proxy' : '',
    options.isHttps ? 'https' : 'http',
    options.proxyHost,
    options.proxyPort,
    auth,
    ip,
    options.proxyTunnelPath || '',
    (options.isHttps && options.cacheKey) || ''
  ].join(':');
}

function getAuths(_url) {
  var options = typeof _url == 'string' ? url.parse(_url) : _url;
  if (!options || !options.auth) {
    return [socks.auth.None()];
  }

  var auths = [];
  options.auth.split('|').forEach(function (auth) {
    auth = auth.trim();
    if (auth) {
      var index = auth.indexOf(':');
      auths.push({
        username: index == -1 ? auth : auth.substring(0, index),
        password: index == -1 ? '' : auth.substring(index + 1)
      });
    }
  });

  return auths.length
    ? auths.map(function (auth) {
      return socks.auth.UserPassword(auth.username, auth.password);
    })
    : [socks.auth.None()];
}

exports.getAuths = getAuths;

exports.setAuth = function (auth) {
  if (auth) {
    config.username = getString(auth.username);
    var password = (config.password = getString(auth.password));
    config.passwordHash = password && createHash(password);
    setGuestAuth(auth);
  }
  return config;
};

exports.getPluginData = function (name) {
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

exports.setGuestAuth = function (auth) {
  auth && setGuestAuth(auth);
};

function parseHost(host) {
  if (Array.isArray(host)) {
    return host.filter(function (h) {
      return h && typeof h === 'string';
    });
  }
  host = typeof host === 'string' ? host.trim() : '';
  return host && host.split('|').map(getHostname);
}

exports.setUIHost = function (host) {
  customUIHost = parseHost(host);
};

exports.setPluginUIHost = function (pluginName, host) {
  if (!pluginName || !WHISTLE_PLUGIN_RE.test(pluginName)) {
    return;
  }
  pluginName = RegExp.$1;
  host = parseHost(host);
  if (host) {
    customPluginNameHost[pluginName] = host;
    host.forEach(function (h) {
      delete customHostPluginMap[h];
    });
  } else {
    delete customPluginNameHost[pluginName];
  }
  customHostPluginMap = {};
  Object.keys(customPluginNameHost).forEach(function (name) {
    var list = customPluginNameHost[name];
    list &&
      list.forEach(function (h) {
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
  var timer = setTimeout(function () {
    if (req) {
      req.emit('error', new Error('Timeout'));
      req.destroy();
      req.socket && req.socket.destroy();
    }
  }, CONN_TIMEOUT);
  var req = httpModule.request(proxyOptions);
  req.on('error', noop);
  req
    .on('connect', function (res, socket) {
      clearTimeout(timer);
      socket.on('error', noop);
      if (res.statusCode !== 200) {
        var err = new Error(
          'Tunneling socket could not be established, statusCode=' +
            res.statusCode
        );
        err.statusCode = res.statusCode;
        socket.destroy();
        process.nextTick(function () {
          req.emit('error', err);
        });
        return;
      }
      if (res.headers['x-whistle-allow-tunnel-ack']) {
        socket.write('1');
      }
      cb(socket, res);
    })
    .end();
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

function getPaths(paths, isCustom) {
  if (typeof paths === 'string') {
    paths = paths.trim().split(/\s*[|,;]\s*/);
  } else if (!Array.isArray(paths)) {
    return;
  }
  var result = [];
  paths.forEach(function (path) {
    if (isCustom && ['self', 'buildin', 'buildIn', 'build-in'].indexOf(path) !== -1) {
      result.push(config.CUSTOM_PLUGIN_PATH);
    } else if (path && typeof path === 'string') {
      result.push(path);
    }
  });
  return result.length ? result : null;
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

function readFileText(filepath) {
  try {
    return fs.readFileSync(filepath, { encoding: 'utf8' }).trim();
  } catch (e) {}
}

function getHostPort(str) {
  if (!/^(?:([\w.-]+):)?([1-9]\d{0,4})$/.test(str)) {
    return;
  }
  return {
    host: RegExp.$1,
    port: parseInt(RegExp.$2, 10)
  };
}

function isPort(port) {
  return /^\d+$/.test(port) && port <= 65535 && port > 0;
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
  str = str && typeof str === 'string' && str.trim();
  if (!str) {
    return '';
  }
  str = readFileText(str) || str;
  if (!/\s/.test(str) && str.indexOf('%') !== -1) {
    try {
      str = decodeURIComponent(str);
    } catch (e) {}
  }
  if (/^\{[\s\S]+\}$/.test(str) || /^\[[\s\S]+\]$/.test(str)) {
    try {
      return json5.parse(str);
    } catch (e) {}
  }
  return str;
}

function getPluginList(list) {
  if (typeof list == 'string') {
    list = list.trim().split(/\s*[,|]\s*/);
  }
  var result;
  if (Array.isArray(list)) {
    list.forEach(function (name) {
      if (WHISTLE_PLUGIN_RE.test(name)) {
        result = result || [];
        result.push(RegExp.$1);
      }
    });
  }
  return result;
}

exports.extend = function (newConf) {
  config.pluginHostMap = {};
  config.uiport = config.port;
  if (process.env.WHISTLE_MODE) {
    newConf = newConf || {};
    newConf.mode = process.env.WHISTLE_MODE + '|' + (newConf.mode || '');
  }
  if (newConf) {
    config.uiMiddleware = newConf.uiMiddlewares || newConf.uiMiddleware;
    if (newConf.cmdName && CMD_RE.test(newConf.cmdName)) {
      config.cmdName = newConf.cmdName;
    }
    if (newConf.account && typeof newConf.account === 'string') {
      config.account = newConf.account;
    }
    config.allowPluginList = getPluginList(newConf.allowPluginList);
    config.blockPluginList = getPluginList(newConf.blockPluginList);

    if (newConf.webUIPath && /^[\w.-]+$/.test(newConf.webUIPath)) {
      config.WEBUI_PATH =
        '/.' + newConf.webUIPath + config.WEBUI_PATH.substring(1);
    }
    if (newConf.cluster) {
      config.headless = true;
      config.workerIndex = process.env.workerIndex;
      if (typeof newConf.mode !== 'string') {
        newConf.mode = '';
      }
    }
    var dnsServer = newConf.dnsServer;
    var resolve6;
    var dnsOptional;
    if (dnsServer && typeof dnsServer === 'string') {
      dnsServer = dnsServer.trim();
      if (/^https?:\/\/.+/.test(dnsServer)) {
        config.dnsOverHttps = dnsServer;
      } else {
        dnsServer = dnsServer.split(/[|,&]/);
      }
    }

    if (dns.getServers && Array.isArray(dnsServer)) {
      var newServers = [];
      dnsServer.forEach(function (ip) {
        ip = typeof ip === 'string' && ip.trim();
        if (/^ipv6$/i.test(ip)) {
          resolve6 = true;
        } else if (ip === 'optional' || ip === 'default') {
          dnsOptional = true;
        } else if (net.isIP(ip)) {
          newServers.push(ip);
        } else if (IPV4_RE.test(ip) || IPV6_RE.test(ip)) {
          var dnsIp = RegExp.$1;
          var dnsPort = RegExp.$2;
          if (net.isIP(dnsIp) && (!dnsPort || isPort(dnsPort.substring(1)))) {
            newServers.push(ip);
          }
        }
      });
      if (newServers.length) {
        dns.setServers(newServers);
        config.resolve6 = resolve6;
        config.dnsOptional = dnsOptional;
        config.dnsServer = newServers.join();
      }
    }

    if (newConf.inspect || newConf.inspectBrk) {
      config.inspectMode = true;
      process.env.PFORK_MODE = 'inline';
    }
    variableProperties.forEach(function (name) {
      config[name] = newConf[name] || pkgConf[name];
    });
    var shadowRules = parseString(newConf.shadowRules);
    var resolveShadowValues = function (obj) {
      if (
        (!obj.rules || typeof obj.rules === 'string') &&
        obj.values &&
        typeof obj.values !== 'string'
      ) {
        config.shadowRules = obj.rules.trim();
        if (Object.keys(obj.values).length) {
          config.shadowValues = obj.values;
        }
      } else {
        config.rules = extend({}, newConf.rules, obj);
      }
    };
    if (typeof shadowRules === 'string') {
      config.shadowRules = shadowRules.trim();
    } else if (Array.isArray(shadowRules)) {
      if (typeof shadowRules[0] === 'string') {
        config.shadowRules = shadowRules[0].trim();
        if (shadowRules[1]) {
          config.rules = extend({}, newConf.rules, shadowRules[1]);
        }
        if (shadowRules[2]) {
          config.values = extend({}, newConf.values, shadowRules[2]);
        }
      } else if (shadowRules[0]) {
        resolveShadowValues(shadowRules[0]);
        if (shadowRules[1]) {
          config.values = extend({}, newConf.values, shadowRules[1]);
        }
      } else if (shadowRules[1]) {
        config.values = extend({}, newConf.values, shadowRules[1]);
      }
    } else if (shadowRules) {
      resolveShadowValues(shadowRules);
    }
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
    if (isPort(newConf.realPort) && config.realPort != config.port) {
      config.realPort = newConf.realPort;
    }
    var realHost = newConf.realHost;
    if (typeof realHost === 'string' && (!realHost || /^[\w.-]+$/.test(newConf.realHost))) {
      config.realHost = newConf.realHost;
    }

    var socksPort = getHostPort(newConf.socksPort);
    if (socksPort) {
      config.socksPort = socksPort.port;
      config.socksHost = socksPort.host;
    }
    var httpPort = getHostPort(newConf.httpPort);
    if (httpPort) {
      config.httpPort = httpPort.port;
      config.httpHost = httpPort.host;
    }
    var httpsPort = getHostPort(newConf.httpsPort);
    if (httpsPort) {
      config.httpsPort = httpsPort.port;
      config.httpsHost = httpsPort.host;
    }

    if (newConf.host && typeof newConf.host === 'string') {
      config.defaultHost = newConf.host;
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
      var mode = newConf.mode.trim().split(/\s*[|,&]\s*/);
      mode.forEach(function (m) {
        m = m.trim();
        if (
          /^(pureProxy|debug|master|disableAuthUI|captureData|headless|strict|proxyServer|encrypted|noGzip|disableUpdateTips|proxifier2?)$/.test(m)
        ) {
          config[m] = true;
        } else if (m === 'showPluginReq') {
          config.showPluginReq = config.debugMode;
        } else if (m === 'disableCustomCerts') {
          config.disableCustomCerts = true;
        } else if (m === 'nohost' || m === 'multienv' || m === 'multiEnv') {
          config[m] = true;
          config.multiEnv = true;
        } else if (m === 'proxyOnly') {
          config.pureProxy = true;
        } else if (m === 'useMultipleRules' || m === 'enableMultipleRules') {
          config.allowMultipleChoice = true;
        } else if (m === 'disableMultipleRules') {
          config.allowMultipleChoice = false;
        } else if (
          m === 'notAllowDisableRules' ||
          m === 'notAllowedDisableRules'
        ) {
          config.notAllowedDisableRules = true;
        } else if (m === 'disableBackOption' || m === 'disabledBackOption') {
          config.disabledBackOption = true;
        } else if (
          m === 'disableMultipleOption' ||
          m === 'disabledMultipleOption'
        ) {
          config.disabledMultipleOption = true;
        } else if (
          m === 'disableRulesOptions' ||
          m === 'disabledRulesOptions'
        ) {
          config.disabledRulesOptions = true;
          config.disabledBackOption = true;
          config.disabledMultipleOption = true;
          config.notAllowedDisableRules = true;
        } else if (
          m === 'notAllowDisablePlugins' ||
          m === 'notAllowedDisablePlugins'
        ) {
          config.notAllowedDisablePlugins = true;
        } else if (m === 'socks') {
          config.socksMode = true;
        } else if (m === 'network') {
          config.networkMode = true;
        } else if (m === 'shadowRules') {
          config.shadowRulesMode = true;
        } else if (m === 'shadowRulesOnly') {
          config.shadowRulesMode = true;
          config.disableWebUI = true;
        } else if (m === 'plugins') {
          config.pluginsMode = true;
        } else if (m === 'pluginsOnly') {
          config.pluginsOnlyMode = true;
        } else if (m === 'rules') {
          config.rulesMode = true;
        } else if (m === 'rulesOnly') {
          config.rulesOnlyMode = true;
        } else if (m === 'httpProxy') {
          config.pureProxy = true;
        } else if (
          m === 'keepXFF' ||
          m === 'x-forwarded-for' ||
          m === 'forwardedFor'
        ) {
          config.keepXFF = true;
        } else if (m === 'x-forwarded-host') {
          config.enableFwdHost = true;
        } else if (m === 'x-forwarded-proto') {
          config.enableFwdProto = true;
        } else if (m === 'INADDR_ANY') {
          config.INADDR_ANY = true;
        } else if (m === 'buildIn' || m === 'build-in') {
          process.env.PFORK_EXEC_PATH = process.execPath;
        } else if (m === 'safe' || m === 'rejectUnauthorized') {
          config.rejectUnauthorized = true;
        } else if (m === 'persistentCapture') {
          config.isEnableCapture = true;
          config.persistentCapture = true;
        } else if (['capture', 'intercept', 'enable-capture', 'enableCapture'].indexOf(m) !== -1) {
          config.isEnableCapture = true;
        } else if (['disable-capture', 'disableCapture'].indexOf(m) !== -1) {
          config.isEnableCapture = false;
        } else if (['http2',  'enable-http2', 'enableHttp2', 'enable-h2', 'enableH2'].indexOf(m) !== -1) {
          config.isEnableHttp2 = true;
        } else if (
          ['disable-http2', 'disableHttp2', 'disable-h2', 'disableH2'].indexOf(m) !== -1
        ) {
          config.isEnableHttp2 = false;
        } else if (m === 'hideLeftBar' || m === 'hideLeftMenu') {
          config.hideLeftMenu = true;
        } else if (DATA_KEY_RE.test(m)) {
          var type = RegExp.$1;
          var override = RegExp.$2 === '=';
          var key = RegExp.$3.toLowerCase();
          switch (type) {
          case 'clientip':
            config.overCipKey = override;
            config.cipKey = key;
            break;
          case 'clientid':
            config.overCidKey = override;
            config.cidKey = key;
            break;
          default:
            config.overTdKey = override;
            config.tdKey = key;
            break;
          }
        }
      });

      if (config.headless) {
        config.noGlobalPlugins = true;
        config.pluginsOnlyMode = true;
        config.disableWebUI = true;
        delete config.rulesOnlyMode;
      } else if (config.shadowRulesMode) {
        config.networkMode = true;
        delete config.rulesOnlyMode;
        delete config.pluginsOnlyMode;
      }
      if (config.rulesOnlyMode) {
        delete config.pluginsOnlyMode;
        delete config.networkMode;
        delete config.pluginsMode;
        config.rulesMode = true;
      } else if (config.pluginsOnlyMode) {
        delete config.networkMode;
        config.rulesMode = true;
        config.pluginsMode = true;
      } else if (config.networkMode) {
        delete config.rulesMode;
        delete config.pluginsMode;
      } else if (config.rulesMode) {
        delete config.pluginsMode;
        delete config.networkMode;
      }
    }
    if (/^\d+$/.test(newConf.timeout)) {
      config.timeout = +newConf.timeout;
    }

    setGuestAuth(newConf);
    config.disableAllRules = newConf.disableAllRules;
    config.disableAllPlugins = newConf.disableAllPlugins;
    if (newConf.replaceExistRule === false) {
      config.replaceExistRule = false;
    } else {
      config.replaceExistRule = newConf.replaceRules;
    }
    if (newConf.replaceExistValue === false) {
      config.replaceExistValue = false;
    } else {
      config.replaceExistValue = newConf.replaceValues;
    }
    if (newConf.certDir && typeof newConf.certDir === 'string') {
      config.certDir = path.resolve(newConf.certDir);
    }
    var mw = newConf.middlewares || newConf.middleware;
    if (typeof mw == 'string') {
      config.middlewares = mw.trim().split(/\s*,\s*/);
    }
    var secureFilter = getSecureFilter(newConf);
    if (typeof secureFilter === 'function') {
      config.secureFilter = secureFilter;
    }
    config.notUninstallPluginPaths = getPaths(newConf.notUninstallPluginPath || newConf.notUninstallPluginPaths);
    config.pluginPaths = getPaths(newConf.pluginPaths || newConf.pluginsPath || newConf.pluginPath);
    config.prePluginsPath = config.projectPluginPaths = getPaths(newConf.projectPluginPaths || newConf.projectPluginsPath || newConf.projectPluginPath);
    config.accountPluginsPath = getPaths(newConf.accountPluginsPath);
    config.customPluginPaths = getPaths(newConf.customPluginPaths || newConf.customPluginsPath || newConf.customPluginPath, true);
    config.addon = getPaths(newConf.addonsPath || newConf.addonPath || newConf.addon);
    if (config.accountPluginsPath) {
      config.customPluginPaths = config.accountPluginsPath.concat(config.customPluginPaths || []);
    }
    if (config.customPluginPaths) {
      config.prePluginsPath = (config.prePluginsPath || []).concat(config.customPluginPaths);
    }

    var pluginHost = newConf.pluginHost;
    if (typeof pluginHost === 'string' && (pluginHost = pluginHost.trim())) {
      pluginHost = qs.parse(pluginHost);
      Object.keys(pluginHost).forEach(function (name) {
        var host = pluginHost[name];
        if (typeof host === 'string' && (host = host.trim())) {
          host = host.toLowerCase().split(/\s*[|,&]\s*/);
          host.forEach(function (h) {
            config.pluginHostMap[h] = name;
          });
        }
      });
    }

    var port = getHostPort(newConf.port);
    if (port) {
      config.host = port.host;
      config.uiport = config.port = port.port;
    }
    if (config.disableWebUI) {
      config.notAllowedDisablePlugins = true;
    } else {
      var uiPort = getHostPort(newConf.uiport);
      if (uiPort) {
        config.customUIPort = uiPort.port != config.port;
        config.uiport = uiPort.port;
        config.uihost = uiPort.host;
      }
    }
  }

  if (!config.rulesMode) {
    config.captureData = true;
  }

  if (!config.authKey) {
    config.authKey = 'auto_' + (Date.now() + Math.random().toFixed(6));
  }
  config.middlewares = Array.isArray(config.middlewares)
    ? config.middlewares.map(resolvePath)
    : [];
  var uiHostList = (config.uiHostList = []);
  if (typeof config.localUIHost === 'string') {
    var localHostList = config.localUIHost.toLowerCase().split(/\s*[|,&]\s*/);
    localHostList.forEach(function (hostname) {
      hostname = getHostname(hostname);
      if (hostname && LOCAL_UI_HOST_LIST.indexOf(hostname) == -1) {
        uiHostList.push(hostname);
      }
    });
    LOCAL_UI_HOST_LIST.push.apply(LOCAL_UI_HOST_LIST, uiHostList);
    // 兼容老版本
    config.customLocalUIHost = uiHostList[0];
  }

  config.setLocalUIHost = function (hostname) {
    config.customLocalUIHost = getHostname(hostname);
  };

  config.localUIHost = 'local.whistlejs.com';

  var isWebUIHost = function (host) {
    if (
      host === 'local.wproxy.org' ||
      uiHostList.indexOf(host) !== -1 ||
      (customUIHost && customUIHost.indexOf(host) !== -1)
    ) {
      return true;
    }
    if (config.pureProxy) {
      return false;
    }
    return LOCAL_UI_HOST_LIST.indexOf(host) !== -1;
  };
  var isLocalUIUrl = function (url) {
    var host = getHostname(url);
    return (
      isWebUIHost(host) ||
      !!config.pluginHostMap[host] ||
      !!customHostPluginMap[host]
    );
  };
  config.isLocalUIUrl = isLocalUIUrl;
  exports.isWebUIHost = isWebUIHost;
  exports.getPluginNameByHost = function (host) {
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
  config.getSocksAgent = function (options) {
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
    agent = options.isHttps
      ? new socks.HttpsAgent(options)
      : new socks.HttpAgent(options);
    socksAgents.set(key, agent);
    agent.on('free', preventThrowOutError);
    return agent;
  };
  var baseDir = config.baseDir
    ? path.resolve(getHomePath(config.baseDir), config.dataDirname)
    : getDataDir(config.dataDirname);
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
    var copyDir =
      typeof newConf.copy == 'string' && encodeURIComponent(newConf.copy);
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
    clientId = [
      Date.now(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random()
    ].join();
    fs.writeFileSync(clientIdFile, clientId);
  }
  config.clientId = clientId;
  config.LOCAL_FILES = path.join(config.baseDir, 'local_files');
  fse.ensureDirSync(config.LOCAL_FILES);
  config.setModified = function (clientId, isRules) {
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
