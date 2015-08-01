var app = require('express')();
var path = require('path');
var auth = require('basic-auth');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var htdocs = require('../htdocs');
var util, username, password, config;

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

app.get('/', function(req, res) {
	res.sendFile(htdocs.getHtmlFile('index.html'));
});

app.get('/index.html', function(req, res) {
	res.sendFile(htdocs.getHtmlFile('network.html'));
});

app.all('/cgi-bin/*', function(req, res) {
	try {
		require(path.join(__dirname, '..' + req.url.replace(/\?.*$/, '')))(req, res);
	} catch(err) {
		res.status(500).send(util.getErrorStack(err));
	}
});

app.get('*.html', function(req, res) {
	res.sendFile(htdocs.getHtmlFile(req.url.substring(1).replace(/(?:\?|#).*$/, '')));
});

app.get('/style/*', function(req, res){
	  res.sendFile(htdocs.getFile(req.url.substring(7)));
});

function checkLogin(req, res) {
	if (!username && !password) {
		
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
	username = config.username || '';
	password = config.password || '';
	
	require('./util')(util = proxy.util);
	require('./config')(config);
	require('./rules-util')(proxy.rulesUtil);
	require('./data')(proxy);
	app.listen(config.uiport);
};