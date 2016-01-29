var url = require('url');
var net = require('net');
var https = require('https');
var http = require('http');
var util = require('../lib/util');

function request(req, res, port, weinre) {
	var options = url.parse(util.getFullUrl(req));
	if (options.protocol == 'https:') {
		options.protocol = 'http:';
		req.headers['x-whistle-https'] = 'true';
	}
	options.host = '127.0.0.1';
	options.method = req.method;
	options.hostname = null;
	options.protocol = null;
	if (port) {
		options.port = port;
	}
	req.headers['x-forwarded-for'] = util.getClientIp(req);
	options.headers = req.headers;
	req.pipe(http.request(options, function(_res) {
		if (weinre && options.pathname == '/target/target-script-min.js') {
			_res.headers['access-control-allow-origin'] = '*';
		}
		res.writeHead(_res.statusCode || 0, _res.headers);
		res.src(_res);
	}));
}

function response(req, res, statusCode, msg) {
	res.writeHead(statusCode || 404, {
    	'content-type': 'text/html; charset=utf-8'
    });
	res.src(util.wrapResponse({
				body: msg || 'Not Found'
			}));
}

module.exports = function(req, res, next) {
	var host = req.headers.host || '';
	var config = this.config;
	var hostname = host.split(':');
	var port = hostname[1] || 80
	hostname = hostname[0];
	if (net.isIP(hostname) && util.isLocalAddress(hostname)) {
		if (port == config.port || port == config.uiport) {
			host = config.localUIHost;
		} else if (port == config.weinreport) {
			host = config.WEINRE_HOST;
		}
	}
	
	var pluginMgr = this.pluginMgr;
	var pluginHomePage;
	if (host == config.localUIHost) {
		request(req, res, config.uiport);
	} else if (host == config.WEINRE_HOST) {
		request(req, res, config.weinreport, true);
	} else if (pluginHomePage = pluginMgr.getPluginByHomePage(util.getFullUrl(req))) {
		pluginMgr.loadPlugin(pluginHomePage, function(err, ports) {
			if (err) {
				response(req, res, 503, err);
				return;
			}
			
			if (!ports.uiPort) {
				response(req, res);
				return;
			}
			
			request(req, res, ports.uiPort);
		});
	} else {
		next();
	}
};
