var app = require('express')();
var path = require('path');
var bodyParser = require('body-parser');
var htdocs = require('../htdocs');
var util = require('../../util');
var config = util.config;
var username = config.username && config.password && 
(config.username + '\n' + config.password);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
	
	next();
});

app.get('/', function(req, res) {
	res.sendFile(htdocs.getHtmlFile('index.html'));
});

app.all('/cgi-bin/*', function(req, res) {
	try {
		require(path.join(__dirname, '..' + req.url.replace(/\?.*$/, '')))(req, res);
	} catch(e) {
		res.sendStatus(404);
	}
});

app.get('*.html', function(req, res) {
	res.sendFile(htdocs.getHtmlFile(req.url.substring(1).replace(/(?:\?|#).*$/, '')));
});

app.get('/style/*', function(req, res){
	  res.sendFile(htdocs.getFile(req.url.substring(7)));
});

module.exports = function(proxy) {
	require('./rules-util')(proxy.rulesUtil);
	app.listen(proxy.uiport);
};