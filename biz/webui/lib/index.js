var express = require('express');
var app = express();
var path = require('path');
var url = require('url');
var auth = require('basic-auth');
var parseurl = require('parseurl');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var httpsUtil;
var htdocs = require('../htdocs');
var DONT_CHECK_PATHS = ['/cgi-bin/server-info', '/cgi-bin/show-host-ip-in-res-headers',
                        '/cgi-bin/lookup-tunnel-dns', '/cgi-bin/rootca'];
var PLUGIN_PATH_RE = /^\/(whistle|plugin)\.([a-z\d_\-]+)(\/)?/;
var proxyEvent, util, username, password, config, pluginMgr;

function dontCheckPaths(req) {
  return DONT_CHECK_PATHS.indexOf(req.path) != -1;
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
      req.url = pathname.replace(/\/[^/]*$/, '') + options.path;
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
  if (checkLogin(req, res)) {
    next();
    return;
  }

  res.setHeader('WWW-Authenticate', ' Basic realm=User Login');
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.status(401).end('Access denied, please <a href="javascript:;" onclick="location.reload()">try again</a>.');
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

function checkLogin(req, res) {
  if (!username && !password || dontCheckPaths(req)) {
    return true;
  }
  if (checkCookie(req)) {
    return true;
  }
  var userInfo = auth(req);
  if (userInfo && (userInfo.name || userInfo.pass)) {
    if (username == userInfo.name && password == userInfo.pass) {
      res.setHeader('set-cookie', '_lkey=' + getLoginKey(req)
        + '; max-age=' + 60 * 60 * 24 * 1000 + '; path=/');
      return true;
    }
  }

  return false;
}

function checkCookie(req) {
  var cookies = req.headers.cookie;
  if (cookies) {
    cookies = cookies.split(/;\s*/g);
    for (var i = 0, len = cookies.length; i < len; i++) {
      var cookie = cookies[i].split('=');
      if (cookie[0] == '_lkey') {
        return cookie.slice(1).join('=') == getLoginKey(req);
      }
    }
  }

  return false;
}

function getLoginKey(req) {
  return shasum(username + '\n' + password
+ '\n' + util.getClientIp(req, true));
}

function shasum(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

module.exports = function(proxy) {
  proxyEvent = proxy;
  config = proxy.config;
  pluginMgr = proxy.pluginMgr;
  var rulesUtil = proxy.rulesUtil;
  username = config.username || '';
  password = config.password || '';

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
