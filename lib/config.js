var path = require('path');
var os = require('os');
var http = require('http');
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
var socks = require('socksv5');
var ClientRequest = require('http').ClientRequest;
var emptyReq;

var httpsAgents = new LRU({max: 360});
var socksAgents = new LRU({max: 100});
var uid = Date.now() + '-' + process.pid + '-' + Math.floor(Math.random() * 10000);
var noop = function() {};
var LOCAL_UI_HOST_LIST = ['local.whistlejs.com', 'l.wproxy.cn', '1.wproxy.cn',
'local.wproxy.org', 'l.wproxy.org', '1.wproxy.org', 'rootca.pro'];
var PLUGIN_RE = /^([a-z\d_\-]+)\.(.+)$/;
var idleTimeout = 60000 * 3;
var variableProperties = ['port', 'uiport', 'encrypted', 'sockets', 'dataDirname', 'storage', 'baseDir',
'username', 'password', 'uipath', 'debugMode', 'localUIHost', 'extra', 'rules', 'values', 'dnsCache', 'allowDisableShadowRules'];

config.PROXY_UA = 'whistle/' + pkgConf.version;
config.ASSESTS_PATH = path.join(__dirname, '../assets');
config.WHISTLE_REQ_FROM_HEADER = 'x-whistle-request-from';
config.WHISTLE_POLICY_HEADER = 'x-whistle-policy';
config.CLIENT_IP_HEAD = 'x-forwarded-for';
config.HTTPS_FIELD = 'x-whistle-https-request';
config.DATA_ID = 'x-whistle-data-id' + '-' + uid;
config.CLIENT_PORT_HEAD = 'x-whistle-client-port-' + uid;
config.WEBUI_HEAD = 'x-forwarded-from-whistle-' + uid;
config.WEBUI_PATH = '/...whistle-path.5b6af7b9884e1165...///';
config.PREVIEW_PATH_RE = /\?\?\?WHISTLE_PREVIEW_CHARSET=([A-Z\d_-]+)\?\?\?$/;

function getHomedir() {
//默认设置为`~`，防止Linux在开机启动时Node无法获取homedir
  return (typeof os.homedir == 'function' ? os.homedir() :
process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) || '~';
}

function getWhistlePath() {
  return process.env.WHISTLE_PATH || path.join(getHomedir(), '.WhistleAppData');
}

function getDataDir(dirname) {
  var dir = path.join(getWhistlePath(), dirname || '.' + config.name);
  fse.ensureDirSync(dir);
  return dir;
}

config.baseDir = getDataDir();
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
    packSocket(s);
    s.setTimeout(idleTimeout, function() {
      s.destroy();
    });
    return s;
  };
  agent.on('free', preventThrowOutError);
  return agent;
}

function getHttpsAgent(options) {
  var key = getCacheKey(options);
  var agent = httpsAgents.get(key);
  var headers = options.headers || {};
  if (!agent) {
    options.proxyAuth = options.auth;
    options.rejectUnauthorized = false;
    options.proxy = {
      host: options.proxyHost,
      port: options.proxyPort,
      headers: headers
    };
    var isHttps = options.isHttps;
    var agentName = isHttps ? 'httpsOverHttp' : 'httpOverHttp';
    if (options.proxyServername) {
      options.proxy.servername = options.proxyServername;
      agentName += 's';
    }
    agent = new tunnel[agentName](options);
    agent.originProxyHeaders = headers;
    httpsAgents.set(key, agent);
    agent.on('free', preventThrowOutError);
    var createSocket = agent.createSocket;
    agent.createSocket = function(opts, cb) {
      createSocket.call(this, opts, function(socket) {
        packSocket(socket);
        socket.setTimeout(idleTimeout, function() {
          socket.destroy();
        });
        cb(socket);
      });
    };
  } else if (agent.originProxyHeaders) {
    if (headers['user-agent']) {
      agent.originProxyHeaders['user-agent'] = headers['user-agent'];
    } else {
      delete agent.originProxyHeaders['user-agent'];
    }
    if (headers['proxy-authorization']) {
      agent.originProxyHeaders['proxy-authorization'] = headers['proxy-authorization'];
    } else {
      delete agent.originProxyHeaders['proxy-authorization'];
    }
  }
  return agent;
}

exports.getHttpsAgent = getHttpsAgent;

function getCacheKey(options, isSocks) {
  var auth = options.auth || options.proxyAuth || '';
  var ip = (!isSocks && options.clientIp) || '';
  return [options.proxyServername ? 'https-proxy' : '', options.isHttps ? 'https' : 'http',
    options.proxyHost, options.proxyPort, auth, ip].join(':');
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
  if (!auth) {
    return;
  }
  config.username = auth.username;
  config.password = auth.password;
};

function toBuffer(buf) {
  if (buf == null || Buffer.isBuffer(buf)) {
    return buf;
  }
  buf += '';
  return Buffer.from(buf);
}

exports.toBuffer = toBuffer;

function connect(options, cb) {
  var headers = options.headers || {};
  headers.host = options.host + ':' + options.port;
  var proxyOptions = {
    method: 'CONNECT',
    agent: false,
    path: headers.host,
    host: options.proxyHost,
    port: options.proxyPort,
    rejectUnauthorized: false,
    headers: headers
  };
  var httpModule = http;
  if (options.proxyServername) {
    proxyOptions.servername = options.proxyServername;
    httpModule = https;
  }
  proxyOptions.headers.host = proxyOptions.path;
  if (options.proxyAuth) {
    proxyOptions.headers['proxy-authorization'] = 'Basic ' + toBuffer(options.proxyAuth).toString('base64');
  }
  var timer = setTimeout(function() {
    req.emit('error', new Error('Timeout'));
    req.abort();
  }, 16000);
  var req = httpModule.request(proxyOptions);
  req.on('connect', function(res, socket) {
    clearTimeout(timer);
    socket.on('error', noop);
    var err;
    if (res.statusCode !== 200) {
      err = new Error('Tunneling socket could not be established, statusCode=' + res.statusCode);
      err.statusCode = res.statusCode;
      socket.destroy();
      process.nextTick(function() {
        req.emit('error', err);
      });
    }
    cb(socket, res, err);
  }).end();
  return req;
}

exports.connect = connect;

function preventThrowOutError(socket) {
  socket.removeListener('error', freeSocketErrorListener);
  socket.on('error', freeSocketErrorListener);
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

function getPluginPaths(newConf) {
  var pluginPaths = newConf.pluginPaths;
  if (!Array.isArray(pluginPaths)) {
    pluginPaths = [pluginPaths];
  }
  pluginPaths = pluginPaths.filter(function(path) {
    return path && typeof path === 'string';
  });
  return pluginPaths.length ? pluginPaths : null;
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

function createHash(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

exports.extend = function(newConf) {
  config.pluginHostMap = {};
  if (newConf) {
    variableProperties.forEach(function(name) {
      config[name] = newConf[name] || pkgConf[name];
      if (name === 'uiport' && newConf[name]) {
        config.customUIPort = true;
      }
    });
    if (newConf.timeout > 0) {
      config.timeout = +newConf.timeout;
    }
    if (newConf.host && typeof newConf.host === 'string') {
      config.host = newConf.host;
    }
    if (typeof newConf.shadowRules === 'string') {
      config.shadowRules = newConf.shadowRules.trim();
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
    if (typeof newConf.mode === 'string') {
      var mode = newConf.mode.trim().split('|');
      mode.forEach(function(m) {
        if (/^(pureProxy|debug|nohost|strict|multiEnv|multienv)$/.test(m)) {
          config[m] = true;
          if (m === 'nohost' || m === 'multienv') {
            config.multiEnv = true;
          }
        } else if (m === 'network') {
          config.networkMode = true;
        } else if (m === 'httpProxy') {
          config.pureProxy = true;
        } else if (m === 'keepXFF') {
          config.keepXFF = true;
        }
      });
    }
    if (newConf.guestName === '-' && !newConf.guestPassword) {
      config.guest = {};
    } else if (newConf.guestName && newConf.guestPassword) {
      config.guest = {
        username: newConf.guestName,
        password: newConf.guestPassword
      };
    }
    config.disableAllRules = newConf.disableAllRules;
    config.disableAllPlugins = newConf.disableAllPlugins;
    config.allowMultipleChoice = newConf.allowMultipleChoice;
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
    if (Array.isArray(newConf.ports)) {
      config.ports = pkgConf.ports.concat(newConf.ports);
    }

    if (typeof newConf.middlewares == 'string') {
      config.middlewares = newConf.middlewares.trim().split(/\s*,\s*/g);
    }
    var secureFilter = getSecureFilter(newConf);
    if (typeof secureFilter === 'function') {
      config.secureFilter = secureFilter;
    }
    config.pluginPaths = getPluginPaths(newConf);
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
  if (config.timeout > idleTimeout) {
    idleTimeout = config.timeout;
  }
  config.idleTimeout = idleTimeout;
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
  
  config.localUIHost = 'local.whistlejs.com';

  exports.getPluginNameByHost = function(host) {
    if (isWebUIHost(host)) {
      return;
    }
    host = getHostname(host);
    return config.pluginHostMap[host];
  };
  var isWebUIHost = function(host) {
    if (host === 'local.wproxy.org' || uiHostList.indexOf(host) !== -1) {
      return true;
    }
    if (config.pureProxy) {
      return false;
    }
    return LOCAL_UI_HOST_LIST.indexOf(host) !== -1;
  };
  var isLocalUIUrl = function(url) {
    var host = getHostname(url);
    return isWebUIHost(host) || !!config.pluginHostMap[host];
  };
  config.isLocalUIUrl = isLocalUIUrl;

  config.isPluginUrl = function(url) {
    var host = getHostname(url);
    return PLUGIN_RE.test(host) && isLocalUIUrl(RegExp.$2);
  };

  config.getPluginName = function(url) {
    var host = getHostname(url);
    if (PLUGIN_RE.test(host)) {
      var name = RegExp.$1;
      if (isLocalUIUrl(RegExp.$2)) {
        return name;
      }
    }
  };

  var port = config.port;
  config.ports.forEach(function(name) {
    if (!/port$/.test(name) || name == 'port') {
      throw new Error('Port name "' + name + '" must be end of "port", but not equals "port", like: ' + name + 'port');
    }
    if (name !== 'uiport' || !(config.uiport > 0)) {
      config[name] = ++port;
    }
  });
  config.sockets = Math.max(parseInt(config.sockets, 10) || 0, 1);
  var agentConfig = {
    maxSockets: config.sockets,
    keepAlive: config.keepAlive,
    keepAliveMsecs: config.keepAliveMsecs
  };
  config.httpAgent = config.debug ? false : createAgent(agentConfig);
  config.httpsAgent = config.debug ? false : createAgent(agentConfig, true);
  config.getSocksAgent = function(options) {
    var key = getCacheKey(options, true);
    var agent = socksAgents.get(key);
    if (agent) {
      return agent;
    }
    extend(options, agentConfig);
    options.proxyPort = parseInt(options.proxyPort, 10) || 1080;
    options.rejectUnauthorized = false;
    options.localDNS = false;
    options.auths = getAuths(options);
    agent = options.isHttps ? new socks.HttpsAgent(options) : new socks.HttpAgent(options);
    socksAgents.set(key, agent);
    agent.on('free', preventThrowOutError);
    var createSocket = agent.createSocket;
    agent.createSocket = function(req, opts) {
      var host = opts && opts.host;
      if (typeof host === 'string') {
        var index = host.indexOf(':');
        if (index !== -1) {
          opts.host = host.substring(0, index);
        }
      }
      var client = createSocket.apply(this, arguments);
      client.on('error', function(err) {
        req.emit('error', err);
      });
      return client;
    };
    return agent;
  };
  config.uipath = config.uipath ? resolvePath(config.uipath) : './webui/lib';
  var baseDir = config.baseDir ? path.resolve(config.baseDir, config.dataDirname) : getDataDir(config.dataDirname);
  var customDirs = path.join(baseDir, 'custom_dirs');
  config.baseDir = baseDir;
  config.storage = config.storage && encodeURIComponent(config.storage);
  if (config.storage) {
    baseDir = path.join(customDirs, config.storage);
  }
  var shasum = crypto.createHash('sha1');
  shasum.update(baseDir);
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
