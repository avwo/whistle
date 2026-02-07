var express = require('express');
var app = express();
var path = require('path');
var http = require('http');
var https = require('https');
var parseReqUrl = require('parseurl');
var bodyParser = require('body-parser');
var fs = require('fs');
var zlib = require('zlib');
var extend = require('extend');
var LRU = require('lru-cache');
var htdocs = require('../htdocs');
var handleWeinreReq = require('../../weinre');
var setProxy = require('./proxy');
var rulesUtil = require('../../../lib/rules/util');
var getRootCAFile = require('../../../lib/https/ca').getRootCAFile;
var config = require('../../../lib/config');
var cgiUtil = require('../cgi-bin/util');
var common = require('../../../lib/util/common');
var getWorker = require('../../../lib/plugins/util').getWorker;
var loadAuthPlugins = require('../../../lib/plugins').loadAuthPlugins;
var parseUrl = require('../../../lib/util/parse-url-safe');

var sendError = cgiUtil.sendError;
var sendGzipText = cgiUtil.sendGzipText;
var parseAuth = common.parseAuth;
var createHash = common.createHash;
var PARSE_CONF = { extended: true, limit: '3mb'};
var UPLOAD_PARSE_CONF = { extended: true, limit: '30mb'};
var PLUGIN_NAMES = new LRU({ max: 360 });
var urlencodedParser = bodyParser.urlencoded(PARSE_CONF);
var jsonParser = bodyParser.json(PARSE_CONF);
var uploadUrlencodedParser = bodyParser.urlencoded(UPLOAD_PARSE_CONF);
var uploadJsonParser = bodyParser.json(UPLOAD_PARSE_CONF);
var GET_METHOD_RE = /^get$/i;
var WEINRE_RE = /^\/weinre\/.*/;
var ALLOW_PLUGIN_PATHS = ['/cgi-bin/rules/list2', '/cgi-bin/values/list2', '/cgi-bin/get-custom-certs-info'];
var SPECIAL_PATHS = ['/cgi-bin/rules/project'];
var DONT_CHECK_PATHS = ['/cgi-bin/server-info', '/cgi-bin/plugins/is-enable', '/cgi-bin/plugins/get-plugins',
  '/preview.html', '/cgi-bin/rootca', '/cgi-bin/check-update', '/cgi-bin/log/set', '/cgi-bin/status'];
var GUEST_PATHS = ['/cgi-bin/composer', '/cgi-bin/socket/data', '/cgi-bin/abort', '/cgi-bin/socket/abort',
  '/cgi-bin/socket/change-status', '/cgi-bin/sessions/export'];
var CORS_PATHS = ['/cgi-bin/status',  '/cgi-bin/rootca'];
var PLUGIN_PATH_RE = /^\/(whistle|plugin)\.([^/?#]+)(\/)?/;
var STATIC_SRC_RE = /\.(?:ico|js|css|png)$/i;
var UPLOAD_URLS = ['/cgi-bin/values/upload', '/cgi-bin/composer', '/cgi-bin/download'];
var ALLOW_CROSS_URLS = ['/cgi-bin/top', '/cgi-bin/status', '/cgi-bin/server-info',
    '/cgi-bin/rootca', '/cgi-bin/check-update', '/cgi-bin/log/set'];
var proxyEvent, util, pluginMgr;
var MAX_AGE = 60 * 60 * 24 * 3;
var MENU_HTML = fs.readFileSync(path.join(__dirname, '../../../assets/menu.html'));
var INSPECTOR_HTML = fs.readFileSync(path.join(__dirname, '../../../assets/tab.html'));
var MODAL_HTML = fs.readFileSync(path.join(__dirname, '../../../assets/modal.html'));
var MENU_URL = '???_WHISTLE_PLUGIN_EXT_CONTEXT_MENU_' + config.port + '???';
var INSPECTOR_URL = '???_WHISTLE_PLUGIN_INSPECTOR_TAB_' + config.port + '???';
var KEY_RE_G = /\${[^{}\s]+}|{\S+}/g;
var COMMENT_RE = /#[^\r\n]*$/mg;

function sendToService(req, res) {
  proxyEvent.loadService(function(err, options) {
    if (err) {
      common.sendRes(res, 500, err.stack || err);
    } else {
      util.transformReq(req, res, options.port);
    }
  });
}

function doNotCheckLogin(req) {
  var path = req.path;
  return STATIC_SRC_RE.test(path) || DONT_CHECK_PATHS.indexOf(path) !== -1;
}

function getUsername() {
  return config.username || '';
}

function getPassword() {
  return config.password || '';
}

function parseCookie(str) {
  var result = {};
  str && str.split(';').forEach(function(pair) {
    var index = pair.indexOf('=');
    if (index === -1) {
      return;
    }
    var key = pair.substring(0, index).trim();
    var val = pair.substring(index + 1).trim();
    if (result[key] == null) {
      try {
        result[key] = decodeURIComponent(val);
      } catch (e) {
        result[key] = val;
      }
    }
  });
  return result;
}

function getLoginKey (req, res, auth) {
  var ip = util.getClientIp(req);
  var password = auth.password;
  if (config.encrypted) {
    password = createHash(password);
  }
  return createHash([auth.username, password, ip].join('\n'));
}

function requireLogin(req, res, msg) {
  if (config.client) {
    if (config.handleWebReq) {
      return config.handleWebReq(req, res);
    }
    return res.status(404).end();
  }
  res.setHeader('WWW-Authenticate', ' Basic realm=User Login');
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.status(401).end(msg || 'Access denied, please <a href="javascript:;" onclick="location.reload()">try again</a>');
}

function equalAuth(auth, src) {
  return auth.name === src.username && auth.pass === src.password;
}

function verifyLogin(req, res, auth) {
  var isGuest = !auth;
  if (isGuest) {
    auth = config.guest;
    if (!auth) {
      return;
    }
    if (!auth.authKey) {
      auth.authKey = 'whistle_v_lk_' + encodeURIComponent(auth.username);
    }
  }
  var username = auth.username;
  var password = auth.password;

  if (!username && !password) {
    return true;
  }
  var authKey = auth.authKey;
  var cookies = parseCookie(req.headers.cookie);
  var lkey = cookies[authKey];
  var correctKey = getLoginKey(req, res, auth);
  if (correctKey === lkey) {
    return true;
  }
  var headerAuth = parseAuth(req.headers.authorization || req.headers['proxy-authorization']);
  var queryAuth = parseAuth(req.query.authorization);
  if (!isGuest && config.encrypted) {
    headerAuth.pass = headerAuth.pass && createHash(headerAuth.pass);
    queryAuth.pass = queryAuth.pass && createHash(queryAuth.pass);
  }
  if (equalAuth(headerAuth, auth) || equalAuth(queryAuth, auth)) {
    res.setHeader('Set-Cookie', [
      authKey + '=' + util.encodeURIComponent(correctKey),
      'Max-Age=' + MAX_AGE,
      'Path=/',
      'Expires=' + new Date(Date.now() + (MAX_AGE * 1000)).toUTCString()
    ].join('; '));
    return true;
  }
}

function checkAuth(req, res) {
  var username = getUsername();
  var auth = {
    authKey: 'whistle_lk_' + encodeURIComponent(username),
    username: username,
    password: getPassword()
  };
  if (verifyLogin(req, res, auth)) {
    return true;
  }
  if (config.specialAuth && SPECIAL_PATHS.indexOf(req.path) !== -1 &&
    config.specialAuth === req.headers['x-whistle-special-auth']) {
    return true;
  }
  requireLogin(req, res);
  return false;
}

app.disable('x-powered-by');

function readRemoteStream(req, res, authUrl) {
  var client;
  var handleError = function(err) {
    res.emit('error', err);
    client && client.destroy();
  };
  if (authUrl[0] === 'f') {
    var stream = fs.createReadStream(authUrl.substring(7));
    stream.on('error', handleError);
    return stream.pipe(res);
  }
  var options = parseUrl(authUrl);
  options.rejectUnauthorized = false;
  var httpModule = options.protocol === 'https:' ? https : http;
  var headers = extend({}, req.headers);
  delete headers.host;
  options.headers = headers;
  client = httpModule.request(options, function(svrRes) {
    svrRes.on('error', handleError);
    res.writeHead(svrRes.statusCode, svrRes.headers);
    svrRes.pipe(res);
  });
  client.on('error', handleError);
  client.end();
}

function injectFile(req, res, filepath, prepend, append, isJs) {
  fs.readFile(filepath, function(err, ctn) {
    if (err) {
      return sendError(res, err);
    }
    sendGzipText(req, res, {
      'Content-Type': (isJs ? 'application/javascript' : 'text/html') + '; charset=utf-8'
    }, concat(prepend, ctn, append));
  });
}

app.use(function(req, res, next) {
  proxyEvent.emit('_request', req.url);
  var aborted;
  var abort = function() {
    if (!aborted) {
      aborted = true;
      res.destroy();
    }
  };
  req.on('error', abort);
  res.on('error', abort).on('close', abort);
  loadAuthPlugins(req, function(status, msg, authUrl) {
    if (!status && !authUrl) {
      return next();
    }
    res.set('x-server', 'whistle');
    res.set('x-module', 'webui');
    if (!msg && !authUrl) {
      return res.redirect(status);
    }
    if (status === 401) {
      return requireLogin(req, res, msg);
    }
    res.set('Content-Type', 'text/html; charset=utf8');
    if (authUrl) {
      return readRemoteStream(req, res, authUrl);
    }
    if (status === 502) {
      return res.status(502).end(msg || 'Error');
    }
    res.status(403).end(msg || 'Forbidden');
  });
});

if (typeof config.uiMiddleware === 'function') {
  app.use(config.uiMiddleware);
}

app.use(function(req, res, next) {
  var referer = req.headers.referer;
  var options = parseReqUrl(req);
  var path = options.path;
  var index = path.indexOf('/whistle/');
  req.url = path;
  if (index === 0) {
    delete req.headers.referer;
    req.url = path.substring(8);
  } else if (PLUGIN_PATH_RE.test(options.pathname)) {
    var pluginName = RegExp['$&'];
    var len = pluginName.length - 1;
    if (len === index) {
      delete req.headers.referer;
      req.url = path.substring(len + 8);
    }
  } else {
    pluginName = config.getPluginNameByHost(req.headers.host);
    if (!pluginName) {
      if (referer) {
        var refOpts = parseUrl(referer);
        var pathname = refOpts.pathname;
        if (PLUGIN_PATH_RE.test(pathname) && RegExp.$3) {
          var name = RegExp.$2;
          req.url = '/' + RegExp.$1 + '.' + name + path;
          PLUGIN_NAMES.set(path, name);
        } else {
          pluginName = config.getPluginNameByHost(refOpts.hostname);
        }
      } else {
        pluginName = PLUGIN_NAMES.get(path);
      }
    }
    if (pluginName) {
      req.url = '/plugin.' + pluginName + path;
    }
  }

  next();
});

app.use(function(req, res, next) {
  if (req.headers.host !== 'rootca.pro') {
    return next();
  }
  var type = 'cer';
  if (!req.path.indexOf('/crt')) {
    type = 'crt';
  } else if (!req.path.indexOf('/pem')) {
    type = 'pem';
  }
  res.download(getRootCAFile(), 'rootCA.' + type);
});

function isAllowHost(host) {
  var list = config.allowOrigin;
  if (list) {
    for (var i = 0, len = list.length; i < len; i++) {
      var h = list[i];
      if (typeof h === 'string' ? host === h : h.test(host)) {
        return true;
      }
    }
  }
}

function checkInternalPath(req) {
  if (config.allowAllOrigin || ALLOW_CROSS_URLS.indexOf(req.path) !== -1) {
    return true;
  }
  var host = req.headers[common.ORIGIN_HOST_HEADER];
  return !host || isAllowHost(host);
}

function checkAllowOrigin(req) {
  var host = req.headers.origin;
  if (!host || typeof host !== 'string' ||
    req.headers['sec-fetch-site'] === 'same-origin') {
    return false;
  }
  if (config.allowAllOrigin) {
    return true;
  }
  if (CORS_PATHS.indexOf(req.path) !== -1) {
    return true;
  }
  if (!config.allowOrigin) {
    return false;
  }
  var index = host.indexOf('://');
  if (index !== -1) {
    host = host.substring(index + 3);
  }
  host = util.parseHost(host)[0];
  return host && isAllowHost(host);
}

function cgiHandler(req, res) {
  if (common.existsUpPath(req.path) || !checkInternalPath(req)) {
    return res.status(403).end('Forbidden');
  }
  if (checkAllowOrigin(req)) {
    res.setHeader('access-control-allow-origin', req.headers.origin);
    res.setHeader('access-control-allow-credentials', true);
  }
  var filepath = path.join(__dirname, '..' + req.path) + '.js';
  var handleResponse = function() {
    try {
      require(filepath)(req, res);
    } catch(err) {
      sendError(res, err);
    }
  };
  if (require.cache[filepath]) {
    return handleResponse();
  }
  common.getStat(filepath, function(err, stat) {
    if (err || !stat.isFile()) {
      var notFound = err ? err.code === 'ENOENT' : !stat.isFile();
      var msg;
      if (config.debugMode) {
        msg = util.THEME_STYLE + '<pre>' + (err ? util.encodeHtml(util.getErrorStack(err)) : 'No such File') + '</pre>';
      } else {
        msg = notFound ? 'Not Found' : 'Internal Server Error';
      }
      return common.sendRes(res, notFound ? 404 : 500, msg);
    }
    handleResponse();
  });
}
app.all('/service/*', sendToService);
app.all('/cgi-bin/service/*', sendToService);
app.all('/cgi-bin/sessions/*', sendToService);
app.post('/cgi-bin/plugins/install', sendToService);
app.all('/favicon.ico', function(req, res) {
  res.sendFile(htdocs.getImgFile('favicon.ico'));
});

function readPluginPage(req, res, plugin, html, config) {
  res.type('html');
  res.write('<!DOCTYPE html>\n');
  res.write(config);
  res.write(html);
  var index = req.path.indexOf('/', 1);
  if (index === -1) {
    res.end();
  } else {
    var filepath = req.path.substring(index + 1);
    var reader = fs.createReadStream(path.join(plugin.path, filepath));
    reader.on('error', function() {
      if (reader) {
        reader = null;
        res.end();
      }
    });
    reader.pipe(res);
  }
}

app.all(PLUGIN_PATH_RE, function(req, res) {
  var result = PLUGIN_PATH_RE.exec(req.url);
  var type = result[1];
  var name = result[2];
  var slash = result[3];
  var plugin = type === 'whistle' ? pluginMgr.getPlugin(name + ':')
    : pluginMgr.getPluginByName(name);
  if (!plugin) {
    return res.status(404).send('Not Found');
  }
  if (req.url.indexOf(MENU_URL) !== -1) {
    return readPluginPage(req, res, plugin, MENU_HTML, plugin[util.PLUGIN_MENU_CONFIG]);
  }
  if (req.url.indexOf(INSPECTOR_URL) !== -1) {
    return readPluginPage(req, res, plugin, INSPECTOR_HTML, plugin[util.PLUGIN_INSPECTOR_CONFIG]);
  }
  if (req.headers[util.INTERNAL_ID_HEADER] === util.INTERNAL_ID) {
    delete req.headers[util.INTERNAL_ID_HEADER];
  } else if (plugin.inheritAuth && !checkAuth(req, res)) {
    return;
  }
  if (!slash) {
    return res.redirect(type + '.' + name + '/');
  }
  pluginMgr.loadPlugin(plugin, function(err, ports) {
    if (err || !ports.uiPort) {
      return common.sendRes(res, err ? 500 : 404, err ? '<pre>' + util.encodeHtml(err) + '</pre>' : 'Not Found');
    }
    var options = parseReqUrl(req);
    var headers = req.headers;
    headers[config.PLUGIN_HOOK_NAME_HEADER] = config.PLUGIN_HOOKS.UI;
    req.url = options.path.replace(result[0].slice(0, -1), '');
    var openInModal = req.url.indexOf('?openInModal=5b6af7b9884e1165') !== -1;
    util.transformReq(req, res, ports.uiPort, null, openInModal ? MODAL_HTML : null);
  });
});

app.use(function(req, res, next) {
  var pathname = req.path;
  if (ALLOW_PLUGIN_PATHS.indexOf(pathname) !== -1) {
    var name = req.headers[config.PROXY_ID_HEADER];
    if (name) {
      return pluginMgr.getPlugin(name + ':') ? next() : res.sendStatus(403);
    }
  }
  if (doNotCheckLogin(req)) {
    return next();
  }
  if (config.disableWebUI && !config.debugMode && (!config.captureData || pathname !== '/cgi-bin/get-data')) {
    return res.status(404).end('Not Found');
  }
  if (config.authKey && config.authKey === req.headers['x-whistle-auth-key']) {
    return next();
  }
  var guestAuthKey = config.guestAuthKey;
  if (((guestAuthKey && guestAuthKey === req.headers['x-whistle-guest-auth-key'])
    || verifyLogin(req, res)) && (!req.method || GET_METHOD_RE.test(req.method)
    || WEINRE_RE.test(pathname) || GUEST_PATHS.indexOf(pathname) !== -1)) {
    return next();
  }
  if (checkAuth(req, res)) {
    next();
  }
});

app.post('/cgi-bin/composer', function(req, res) {
  req.headers[config.CLIENT_IP_HEADER] = util.getClientIp(req);
  req.headers[config.CLIENT_PORT_HEADER] = util.getClientPort(req);
  sendToService(req, res);
});
app.get('/cgi-bin/compose-data', sendToService);
app.all('/cgi-bin/saved/*', sendToService);
app.all('/cgi-bin/temp/*', sendToService);
app.get('/cgi-bin/history', sendToService);
function sendText(req, res, text) {
  sendGzipText(req, res, {
    'Content-Type': 'text/plain; charset=utf-8'
  }, typeof text === 'string' ? text : '');
}

function parseKey(key) {
  return key[0] === '$' ? key.slice(2, -1) : key.slice(1, -1);
}

if (config.handleUpdate) {
  app.post('/cgi-bin/update', config.handleUpdate);
}

app.get('/rules', function(req, res) {
  var query = req.query;
  var name = query.name || query.key;
  if (name === 'Default') {
    name = rulesUtil.rules.getDefault();
  } else if (name) {
    name = rulesUtil.rules.get(name);
  } else {
    name = rulesUtil.rules.getRawRulesText();
  }
  if (name && query.values !== 'false' && !(query.values <= 0)) {
    var keys = name.replace(COMMENT_RE, '').match(KEY_RE_G);
    if (keys) {
      keys = keys.map(parseKey).map(function (key) {
        return util.wrapRuleValue(key, rulesUtil.values.get(key), query.values, query.policy);
      }).join('');
      if (keys) {
        name += '\n' + keys;
      }
    }
  }
  sendText(req, res, name);
});

app.get('/values', function(req, res) {
  var name = req.query.name || req.query.key;
  sendText(req, res, rulesUtil.values.get(name));
});

app.get('/web-worker.js', urlencodedParser, function(req, res) {
  var body = getWorker(req.query.id);
  if (!body) {
    return res.status(404).end('Not Found');
  }
  sendGzipText(req, res, {
    'Content-Type': 'application/javascript; charset=utf-8'
  }, body);
});

app.all('/cgi-bin/*', function(req, res, next) {
  req.isUploadReq = UPLOAD_URLS.indexOf(req.path) !== -1;
  return req.isUploadReq ? uploadUrlencodedParser(req, res, next) : urlencodedParser(req, res, next);
}, function(req, res, next) {
  return req.isUploadReq ? uploadJsonParser(req, res, next) : jsonParser(req, res, next);
}, cgiHandler);

app.use('/preview.html', function(req, res, next) {
  if (req.headers[util.INTERNAL_ID_HEADER] !== util.INTERNAL_ID) {
    return res.status(404).end('Not Found');
  }
  next();
  var index = req.path.indexOf('=') + 1;
  if (index) {
    var charset = req.path.substring(index);
    res.set('content-type', 'text/html;charset=' + charset);
  }
});

var uiExt = config.uiExt || {};
var htmlPrepend = uiExt.htmlPrepend;
var htmlAppend = uiExt.htmlAppend;
var jsPrepend = uiExt.jsPrepend;
var jsAppend = uiExt.jsAppend;
var htmlFile = htdocs.getHtmlFile('index.html');
var jsFile = htdocs.getJsFile('index.js');

function concat(a, b, c) {
  if (!a && !c) {
    return b;
  }
  var list = [];
  a && list.push(a);
  list.push(b);
  c && list.push(c);
  return Buffer.concat(list);
}

if (!config.debugMode) {
  var indexHtml = concat(htmlPrepend, fs.readFileSync(htmlFile), htmlAppend);
  var indexJs = concat(jsPrepend, fs.readFileSync(jsFile), jsAppend);
  var jsETag = createHash(indexJs);
  var gzipIndexHtml = zlib.gzipSync(indexHtml);
  var gzipIndexJs = zlib.gzipSync(indexJs);
  app.use('/js/index.js', function(req, res) {
    if (req.headers['if-none-match'] === jsETag) {
      return res.sendStatus(304);
    }
    var headers = {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ETag: jsETag
    };
    sendGzipText(req, res, headers, indexJs, gzipIndexJs);
  });
  var sendIndex = function(req, res) {
    sendGzipText(req, res, {
      'Content-Type': 'text/html; charset=utf-8'
    }, indexHtml, gzipIndexHtml);
  };
  app.get('/', sendIndex);
  app.get('/index.html', sendIndex);
} else {
  if (htmlPrepend || htmlAppend) {
    var injectHtml = function(req, res) {
      injectFile(req, res, htmlFile, htmlPrepend, htmlAppend);
    };
    app.get('/', injectHtml);
    app.get('/index.html', injectHtml);
  }
  if (jsPrepend || jsAppend) {
    app.get('/js/index.js', function(req, res) {
      injectFile(req, res, jsFile, jsPrepend, jsAppend, true);
    });
  }
}


app.all(WEINRE_RE, function(req, res) {
  var options = parseReqUrl(req);
  if (options.pathname === '/weinre/client') {
    return res.redirect('client/' + (options.search || ''));
  }
  req.url = options.path.replace('/weinre', '');
  handleWeinreReq(req, res);
});

function init(proxy) {
  if (proxyEvent) {
    return;
  }
  proxyEvent = proxy;
  pluginMgr = proxy.pluginMgr;
  util = proxy.util;
  setProxy(proxy);
}

app.use(express.static(path.join(__dirname, '../htdocs'), {maxAge: 600000}));

exports.init = init;
exports.setupServer = function(server) {
  server.on('request', app);
};
module.exports.handleRequest = app;
