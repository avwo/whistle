var express = require('express');
var app = express();
var path = require('path');
var auth = require('basic-auth');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var htdocs = require('../htdocs');
var DONT_CHECK_PATHS = ['/cgi-bin/server-info', '/cgi-bin/show-host-ip-in-res-headers', '/cgi-bin/lookup-tunnel-dns'];
var util, username, password, config;

function dontCheckPaths(req) {
	var path = typeof req.path == 'string' ? req.path.replace(/[?#].*$/, '') : '';
	return !!path && DONT_CHECK_PATHS.indexOf(path) != -1;
}

app.use(function(req, res, next) {
	req.on('error', abort).on('close', abort);
	res.on('error', abort);
	function abort(err) {
		res.destroy();
	}
	next();
});

app.use(bodyParser.urlencoded({ extended: true, limit: '1mb'}));
app.use(bodyParser.json());


app.use(function(req, res, next) {
	if (checkLogin(req, res)) {
		next();
		return;
	}
	
	res.setHeader('WWW-Authenticate', ' Basic realm=User Login');
	res.status(401).end('Please enter your username and password.');
});

app.all('/cgi-bin/*', function(req, res) {
	try {
		if (req.headers.origin) {
			res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
			res.setHeader('Access-Control-Allow-Credentials', true);
		}
		require(path.join(__dirname, '..' + req.path))(req, res);
	} catch(err) {
		res.status(500).send(util.getErrorStack(err));
	}
});

app.use(express.static(path.join(__dirname, '../htdocs'), {maxAge: 300000}));

app.get('*', function(req, res) {
	res.sendFile(htdocs.getHtmlFile('index.html'));
});

function checkLogin(req, res) {
	if (!username && !password || dontCheckPaths(req)) {
		
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
	
	return checkCookie(req);
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
	config = proxy.config;
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
	require('./https-util')(proxy.httpsUtil);
	require('./data')(proxy);
	app.listen(config.uiport);
};