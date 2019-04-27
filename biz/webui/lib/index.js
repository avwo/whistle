var express = require('express');
var app = express();
var path = require('path');
var url = require('url');
var getAuth = require('basic-auth');
var parseurl = require('parseurl');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var cookie = require('cookie');
var htdocs = require('../htdocs');
var handleWeinreReq = require('../../weinre');
var setProxy = require('./proxy');
var getRootCAFile = require('../../../lib/https/ca').getRootCAFile;

var PARSE_CONF = { extended: true, limit: '3mb'};
var UPLOAD_PARSE_CONF = { extended: true, limit: '30mb'};
var urlencodedParser = bodyParser.urlencoded(PARSE_CONF);
var jsonParser = bodyParser.json(PARSE_CONF);
var uploadUrlencodedParser = bodyParser.urlencoded(UPLOAD_PARSE_CONF);
var uploadJsonParser = bodyParser.json(UPLOAD_PARSE_CONF);
var GET_METHOD_RE = /^get$/i;
var WEINRE_RE = /^\/weinre\/.*/;
var DONT_CHECK_PATHS = ['/cgi-bin/server-info', '/cgi-bin/show-host-ip-in-res-headers',
                        '/cgi-bin/composer', '/cgi-bin/socket/data', '/preview.html',
                        '/cgi-bin/socket/abort', '/cgi-bin/socket/change-status',
                        '/cgi-bin/sessions/export', '/cgi-bin/sessions/import',
                        '/cgi-bin/lookup-tunnel-dns', '/cgi-bin/rootca', '/cgi-bin/log/set'];
var PLUGIN_PATH_RE = /^\/(whistle|plugin)\.([^/?#]+)(\/)?/;
var STATIC_SRC_RE = /\.(?:ico|js|css|png)$/i;
var proxyEvent, util, config, pluginMgr, uiPortCookie;
var MAX_AGE = 60 * 60 * 24 * 3;

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

function shasum(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str || '');
  return shasum.digest('hex');
}

function getLoginKey (req, res, auth) {
  var ip = util.getClientIp(req);
  var password = auth.password;
  if (config.encrypted) {
    password = shasum(password);
  }
  return shasum([auth.username, password, ip].join('\n'));
}

function requireLogin(res) {
  res.setHeader('WWW-Authenticate', ' Basic realm=User Login');
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.status(401).end('Access denied, please <a href="javascript:;" onclick="location.reload()">try again</a>.');
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
  if (!auth) {
    return;
  }
  var username = auth.username;
  var password = auth.password;

  if (!username && !password) {
    return true;
  }
  var authKey = auth.authKey;
  var cookies = cookie.parse(req.headers.cookie || '');
  var lkey = cookies[authKey];
  var correctKey = getLoginKey(req, res, auth);
  if (correctKey === lkey) {
    return true;
  }
  auth = getAuth(req) || {};
  if (!isGuest && config.encrypted) {
    auth.pass = shasum(auth.pass);
  }
  if (auth.name === username && auth.pass === password) {
    var options = {
      expires: new Date(Date.now() + (MAX_AGE * 1000)),
      maxAge: MAX_AGE,
      path: '/'
    };
    res.setHeader('Set-Cookie', cookie.serialize(authKey, correctKey, options));
    return true;
  }
}

function checkAuth(req, res, auth) {
  if (verifyLogin(req, res, auth)) {
    return true;
  }
  requireLogin(res);
  return false;
}

app.use(function(req, res, next) {
  proxyEvent.emit('_request', req.url);
  var aborted;
  req.on('error', abort).on('close', abort);
  res.on('error', abort);
  function abort() {
    if (!aborted) {
      aborted = true;
      res.destroy();
    }
  }
  var referer = req.headers.referer;
  var options = parseurl(req);
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
    if (!pluginName && referer) {
      var refOpts = url.parse(referer);
      var pathname = refOpts.pathname;
      if (PLUGIN_PATH_RE.test(pathname) && RegExp.$3) {
        req.url = '/' + RegExp.$1 + '.' + RegExp.$2 + path;
      } else {
        pluginName = config.getPluginNameByHost(refOpts.hostname);
      }
    }
    if (pluginName) {
      req.url = '/whistle.' + pluginName + path;
    }
  }

  next();
});

app.use(function(req, res, next) {
  if (req.headers.host !== 'rootca.pro') {
    return next();
  }
  res.download(getRootCAFile(), 'rootCA.' + (req.path.indexOf('/cer') ? 'crt' : 'cer'));
});

function cgiHandler(req, res) {
  try {
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Credentials', true);
    }
    require(path.join(__dirname, '..' + req.path))(req, res);
  } catch(err) {
    res.status(500).send(config.debugMode ?
        '<pre>' + util.getErrorStack(err) + '</pre>' : 'Internal Server Error');
  }
}

app.all('/cgi-bin/sessions/*', cgiHandler);
app.all('/favicon.ico', function(req, res) {
  res.sendFile(htdocs.getImgFile('favicon.ico'));
});
app.all(PLUGIN_PATH_RE, function(req, res, next) {
  var result = PLUGIN_PATH_RE.exec(req.url);
  var type = result[1];
  var name = result[2];
  var slash = result[3];
  var plugin = type === 'whistle' ? pluginMgr.getPlugin(name + ':')
    : pluginMgr.getPluginByName(name);
  if (!plugin) {
    return res.status(404).send('Not Found');
  }
  if (!slash) {
    return res.redirect(type + '.' + name + '/');
  }
  pluginMgr.loadPlugin(plugin, function(err, ports) {
    if (err || !ports.uiPort) {
      if (err) {
        res.status(500).send('<pre>' + err + '</pre>');
      } else {
        res.status(404).send('Not Found');
      }
      return;
    }
    var options = parseurl(req);
    req.headers[config.PLUGIN_HOOK_NAME_HEADER] = config.PLUGIN_HOOKS.UI;
    req.url = options.path.replace(result[0].slice(0, -1), '');
    util.transformReq(req, res, ports.uiPort);
  });
});

app.use(function(req, res, next) {
  var authKey = config.authKey;
  if ((authKey && authKey === req.headers['x-whistle-auth-key'])
    || doNotCheckLogin(req)) {
    return next();
  }
  if (req.headers[config.WEBUI_HEAD] && (req.path === '/' || req.path === '/index.html')) {
    res.setHeader('Set-Cookie', uiPortCookie);
  }
  var guestAuthKey = config.guestAuthKey;
  if (((guestAuthKey && guestAuthKey === req.headers['x-whistle-guest-auth-key'])
    || verifyLogin(req, res)) && (!req.method || GET_METHOD_RE.test(req.method) || WEINRE_RE.test(req.path))) {
    return next();
  }
  var username = getUsername();
  var password = getPassword();
  var authConf = {
    authKey: 'whistle_lk_' + encodeURIComponent(username),
    username: username,
    password: password
  };
  if (checkAuth(req, res, authConf)) {
    next();
  }
});

app.all('/cgi-bin/*', function(req, res, next) {
  return req.path === '/cgi-bin/values/upload' ?
    uploadUrlencodedParser(req, res, next) : urlencodedParser(req, res, next);
});
app.all('/cgi-bin/*', function(req, res, next) {
  return req.path === '/cgi-bin/values/upload' ?
    uploadJsonParser(req, res, next) : jsonParser(req, res, next);
});
app.all('/cgi-bin/*', cgiHandler);

app.use('/preview.html', function(req, res, next) {
  next();
  var index = req.path.indexOf('=') + 1;
  if (index) {
    var charset = req.path.substring(index);
    res.set('content-type', 'text/html;charset=' + charset);
  }
});
app.use(express.static(path.join(__dirname, '../htdocs'), {maxAge: 300000}));

app.get('/', function(req, res) {
  res.sendFile(htdocs.getHtmlFile('index.html'));
});

app.all(WEINRE_RE, function(req, res) {
  var options = parseurl(req);
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
  config = proxy.config;
  pluginMgr = proxy.pluginMgr;
  util = proxy.util;
  uiPortCookie = cookie.serialize('_whistleuipath_', config.port, {
    expires: new Date(Date.now() + 10000),
    maxAge: 10
  });
  setProxy(proxy);
}

exports.init = init;
exports.setupServer = function(server) {
  server.on('request', app);
};
module.exports.handleRequest = app;
