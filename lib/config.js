var path = require('path');
var os = require('os');
var http = require('http');
var httpAgent = http.Agent;
var httpsAgent = require('https').Agent;
var url = require('url');
var fse = require('fs-extra');
var _extend = require('util')._extend;
var pkgConf = require('../package.json');
var config = _extend(exports, pkgConf);
var tunnel = require('./util/agent');
var socks = require('socksv5');
var httpsAgents = {};
var httpAgents = {};
var socksAgents = {};
var uid = Date.now() + '-' + process.pid;
var noop = function() {};
var LOCAL_UI_HOST_LIST = ['local.whistlejs.com', 'local.wproxy.org', 'rootca.pro'];
var PLUGIN_RE = /^([a-z\d_\-]+)\.(.+)$/;
var INTER_PORT_RE = /^(?:(\d{1,5})\.)?([a-z\d_\-]+)\.(.+)$/;
var idleTimeout = 60000;
var variableProperties = ['port', 'ATS', 'sockets', 'timeout', 'dataDirname', 'storage',
'username', 'password', 'uipath', 'debug', 'debugMode', 'localUIHost', 'extra'];

config.ASSESTS_PATH = path.join(__dirname, '../assets');
config.WHISTLE_POLICY_HEADER = 'x-whistle-policy';
config.HTTPS_FIELD = 'x-' + config.name + '-https-request';
config.DATA_ID = 'x-' + config.name + '-data-id' + '-' + uid;
config.CLIENT_IP_HEAD = 'x-forwarded-for-' + config.name + '-' + uid;
config.HTTPS_FLAG = config.whistleSsl + '.';
config.WEBUI_HEAD = 'x-forwarded-from-' + config.name + '-' + uid;

function getHomeDirname() {
  var homedir = (getHomedir() || '').split(/[\/\\]/g);
  for (var i = homedir.length - 1; i >= 0; i--) {
    if (homedir[i]) {
      return homedir[i];
    }
  }
  return '';
}

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

exports.getDataDir = getDataDir;

try {
  var async_id_symbol = process.binding('async_wrap').async_id_symbol;
} catch (e) {}
function createAgent(agentConfig, https) {
  var agent = new (https ? httpsAgent : httpAgent)(agentConfig);
  if (async_id_symbol) {
    var addRequest = agent.addRequest;
    agent.addRequest = function(req) {
      var onSocket = req.onSocket;
      req.onSocket = function(socket) {
        try {
          socket[async_id_symbol] = socket._handle.getAsyncId();
        } catch(e) {}
        onSocket.apply(this, arguments);
      };
      addRequest.apply(this, arguments);
    };
  }
  var createConnection = agent.createConnection;
  agent.createConnection = function() {
    var s = createConnection.apply(this, arguments);
    s.setTimeout(idleTimeout, function() {
      s.destroy();
    });
    return s;
  };
  agent.on('free', preventThrowOutError);
  return agent;
}

function getHttpsAgent(options) {
  return getAgent(options, httpsAgents, 'httpsOverHttp');
}

exports.getHttpsAgent = getHttpsAgent;

function getHttpAgent(options) {
  return getAgent(options, httpAgents, 'httpOverHttp');
}

exports.getHttpAgent = getHttpAgent;

function getAgent(options, cache, type) {
  var key = getCacheKey(options);
  var agent = cache[key];
  if (!agent) {
    options.proxyAuth = options.auth;
    options = {
      proxy: options,
      rejectUnauthorized: false
    };
    agent = cache[key] = new tunnel[type || 'httpsOverHttp'](options);
    agent.on('free', preventThrowOutError);
    var createSocket = agent.createSocket;
    agent.createSocket = function(options, cb) {
      createSocket.call(this, options, function(socket) {
        socket.setTimeout(idleTimeout, function() {
          socket.destroy();
        });
        cb(socket);
      });
    };
  }

  return agent;
}

function getCacheKey(options) {
  return [options.isHttps ? 'https' : 'http', options.host, options.port, options.auth || options.proxyAuth || ''].join(':');
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

function toBuffer(buf) {
  if (buf == null || buf instanceof Buffer) {
    return buf;
  }
  buf += '';
  return new Buffer(buf);
}

exports.toBuffer = toBuffer;

function connect(options, cb) {
  var proxyOptions = {
    method: 'CONNECT',
    agent: false,
    path: options.host + ':' + options.port,
    host: options.proxyHost,
    port: options.proxyPort,
    headers: options.headers || {}
  };
  proxyOptions.headers.host = proxyOptions.path;
  if (options.proxyAuth) {
    proxyOptions.headers['proxy-authorization'] = 'Basic ' + toBuffer(options.proxyAuth).toString('base64');
  }
  var timer = setTimeout(function() {
    req.emit('error', new Error('Timeout'));
    req.abort();
  }, 16000);
  var req = http.request(proxyOptions);
  req.on('connect', function(res, socket, head) {
    clearTimeout(timer);
    socket.on('error', noop);
    cb(socket);
    if (res.statusCode !== 200) {
      process.nextTick(function() {
        req.emit('error', new Error('Tunneling socket could not be established, statusCode=' + res.statusCode));
      });
    }
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

exports.extend = function extend(newConf) {
  if (newConf) {
    variableProperties.forEach(function(name) {
      config[name] = newConf[name] || pkgConf[name];
    });
    if (newConf.certDir && typeof newConf.certDir === 'string') {
      config.certDir = newConf.certDir;
    }
    if (Array.isArray(newConf.ports)) {
      config.ports = pkgConf.ports.concat(newConf.ports);
    }

    if (typeof newConf.middlewares == 'string') {
      config.middlewares = newConf.middlewares.trim().split(/\s*,\s*/g);
    }
    if (newConf.rules) {
      if (Array.isArray(newConf.rules)) {
        newConf.rules = newConf.rules.join('\n');
      }
      if (newConf.rules && typeof newConf.rules == 'string') {
        config.rules = newConf.rules.trim();
      }
    }

    if (newConf.values && typeof newConf.values == 'object') {
      config.values = newConf.values;
    }

    config.pluginPaths = getPluginPaths(newConf);
  }
  if (config.timeout > idleTimeout) {
    idleTimeout = +config.timeout;
  }
  config.middlewares = Array.isArray(config.middlewares) ? config.middlewares.map(resolvePath) : [];
  config.localUIHost = getHostname(config.localUIHost);
  if (config.localUIHost && LOCAL_UI_HOST_LIST.indexOf(config.localUIHost) == -1) {
    LOCAL_UI_HOST_LIST.push(config.localUIHost);
  }
  config.localUIHost = 'local.whistlejs.com';
  config.WEINRE_HOST = 'weinre.' + config.localUIHost;

  var isLocalUIUrl = function(url) {
    return LOCAL_UI_HOST_LIST.indexOf(getHostname(url)) != -1;
  };
  config.isLocalUIUrl = isLocalUIUrl;

  var parseInternalUrl = function(url) {
    var host = getHostname(url);
    if (INTER_PORT_RE.test(host)) {
      var port = RegExp.$1;
      var name = RegExp.$2;
      if (isLocalUIUrl(RegExp.$3)) {
        return {
          port: port,
          name: name
        };
      }
    }
  };
  exports.parseInternalUrl = parseInternalUrl;

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
    config[name] = ++port;
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
    var key = getCacheKey(options);
    var agent = socksAgents[key];
    if (!agent) {
      var proxyOptions = _extend({}, agentConfig);
      proxyOptions.proxyHost = options.host;
      proxyOptions.proxyPort = parseInt(options.port, 10) || 1080;
      proxyOptions.rejectUnauthorized = false;
      proxyOptions.localDNS = false;
      proxyOptions.auths = getAuths(options);
      agent = socksAgents[key] = options.isHttps ? new socks.HttpsAgent(proxyOptions) : new socks.HttpAgent(proxyOptions);
      agent.on('free', preventThrowOutError);
      var createSocket = agent.createSocket;
      agent.createSocket = function(req, options) {
        var client = createSocket.apply(this, arguments);
        client.on('error', function(err) {
          req.emit('error', err);
        });
        return client;
      };
    }

    return agent;
  };
  config.uipath = config.uipath ? resolvePath(config.uipath) : './webui/app';
  config.DATA_DIR = getDataDir(config.dataDirname);
  config.storage = config.storage && encodeURIComponent(config.storage);
  var customDirs = path.join(config.DATA_DIR, 'custom_dirs');
  var root = config.storage ? path.join(customDirs, config.storage) : config.DATA_DIR;
  config.rulesDir = path.join(root, 'rules');
  config.valuesDir = path.join(root, 'values');
  config.propertiesDir = path.join(root, 'properties');
  config.homeDirname = getHomeDirname();
  if (config.storage && newConf.copy) {
    var copyDir = typeof newConf.copy == 'string' && encodeURIComponent(newConf.copy);
    if (copyDir !== config.storage) {
      var dataDir = copyDir ? path.join(customDirs, copyDir) : config.DATA_DIR;
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
  return config;
};
