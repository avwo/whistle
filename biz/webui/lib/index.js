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

var DONT_CHECK_PATHS = ['/cgi-bin/server-info', '/cgi-bin/show-host-ip-in-res-headers', '/js/inject.js',
                        '/cgi-bin/lookup-tunnel-dns', '/cgi-bin/rootca', '/cgi-bin/log/set',
                        '/cgi-bin/get-users', '/cgi-bin/get-user-envs', '/cgi-bin/select-user-env'];
var PLUGIN_PATH_RE = /^\/(whistle|plugin)\.([a-z\d_\-]+)(\/)?/;
var httpsUtil, proxyEvent, util, config, pluginMgr;
var MAX_AGE = 60 * 60 * 24 * 3;
var NAME_KEY = 'whistle_username';
var AUTH_CONFIG = {
  nameKey: NAME_KEY,
  authKey: 'whistle_lkey'
};

function isUserPath(req) {
  var path = req.path;
  return path.indexOf('/cgi-bin/user/') === 0 || path.indexOf('/whistle/user/') === 0;
}

function doNotCheckLogin(req) {
  return DONT_CHECK_PATHS.indexOf(req.path) !== -1;
}

function getUsername() {
  return config.username || '';
}

function getPassword() {
  return config.password || '';
}

function shasum(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

function getLoginKey (req, res, auth) {
  var ip = util.getClientIp(req, true);
  return shasum([auth.username, auth.password, ip].join('\n'));
}

function requireLogin(res) {
  res.setHeader('WWW-Authenticate', ' Basic realm=User Login');
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.status(401).end('Access denied, please <a href="javascript:;" onclick="location.reload()">try again</a>.');
}

function checkAuth(req, res, auth, isUser) {
  var username = auth.username;
  var password = auth.password;
  var nameKey = auth.nameKey;
  var authKey = auth.authKey;

  if (!username && !password) {
    if (isUser) {
      requireLogin(res);
      return false;
    }
    return true;
  }
  var cookies = req.cookies || cookie.parse(req.headers.cookie || '');
  req.cookies = cookies;

  var curName = cookies[nameKey];
  var lkey = cookies[authKey];
  var correctKey = getLoginKey(req, res, auth);
  if (curName === username && correctKey === lkey) {
    return true;
  }
  auth = getAuth(req) || {};
  if (auth.name === username && auth.pass === password) {
    var options = {
      expires: new Date(Date.now() + (MAX_AGE * 1000)),
      maxAge: MAX_AGE,
      path: '/'
    };
    res.setHeader('Set-Cookie', cookie.serialize(nameKey, username, options));
    res.setHeader('Set-Cookie', cookie.serialize(authKey, correctKey, options));
    return true;
  }
  requireLogin(res);
  return false;
}

app.use(function(req, res, next) {
  proxyEvent.emit('_request', req.url);
  req.on('error', abort).on('close', abort);
  res.on('error', abort);
  function abort() {
    res.destroy();
  }
  var referer = req.headers.referer;
  var options = parseurl(req);
  if (referer && !PLUGIN_PATH_RE.test(options.pathname)) {
    var refOpts = url.parse(referer);
    var pathname = refOpts.pathname;
    if (PLUGIN_PATH_RE.test(pathname) && RegExp.$3) {
      req.url = '/' + RegExp.$1 + '.' + RegExp.$2 + options.path;
    }
  }

  next();
});

app.use(function(req, res, next) {
  if (req.headers.host !== 'rootca.pro') {
    return next();
  }
  res.download(httpsUtil.getRootCAFile(), 'rootCA.crt');
});

function cgiHandler(req, res) {
  try {
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Credentials', true);
    }
    require(path.join(__dirname, '..' + req.path))(req, res);
  } catch(err) {
    res.status(500).send(util.getErrorStack(err));
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
      res.status(err ? 500 : 404).send(err || 'Not Found');
      return;
    }
    var options = parseurl(req);
    req.url = options.path.replace(result[0].slice(0, -1), '');
    util.transformReq(req, res, ports.uiPort);
  });
});
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb'}));
app.use(bodyParser.json());


app.use(function(req, res, next) {
  if (doNotCheckLogin(req)) {
    return next();
  }
  // AUTH_CONFIG.username = getUsername();
  // AUTH_CONFIG.password = getPassword();
  var cookies = cookie.parse(req.headers.cookie || '');
  req.cookies = cookies;
  var name = cookies[NAME_KEY];
  AUTH_CONFIG.username = name;
  AUTH_CONFIG.password = 'TODO';
  if (isUserPath(req) && checkAuth(req, res, AUTH_CONFIG, true)) {
    return next();
  }
  AUTH_CONFIG.username = getUsername();
  AUTH_CONFIG.password = getPassword();
  if (checkAuth(req, res, AUTH_CONFIG)) {
    next();
  }
});

app.all('/cgi-bin/*', cgiHandler);

app.use(express.static(path.join(__dirname, '../htdocs'), {maxAge: 300000}));

app.get('/', function(req, res) {
  res.sendFile(htdocs.getHtmlFile('index.html'));
});

app.all(/^\/weinre\/.*/, function(req, res) {
  var options = parseurl(req);
  if (options.pathname === '/weinre/client') {
    return res.redirect('client/' + (options.search || ''));
  }
  req.url = options.path.replace('/weinre', '');
  util.transformReq(req, res, config.weinreport, true);
});

module.exports = function(proxy) {
  proxyEvent = proxy;
  config = proxy.config;
  pluginMgr = proxy.pluginMgr;
  var rulesUtil = proxy.rulesUtil;

  require('./proxy')(proxy);
  require('./util')(util = proxy.util);
  require('./config')(config);
  require('./rules-util')(rulesUtil);
  require('./rules')(rulesUtil.rules);
  require('./properties')(rulesUtil.properties);
  require('./values')(rulesUtil.values);
  require('./https-util')(httpsUtil = proxy.httpsUtil);
  require('./data')(proxy);
  app.listen(config.uiport);
};
