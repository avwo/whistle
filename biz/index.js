var url = require('url');
var net = require('net');
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
		if (util.getStatusCode(_res.statusCode)) {
			res.writeHead(_res.statusCode, _res.headers);
			res.src(_res);
			_res.trailers && res.addTrailers(_res.trailers);
		} else {
			util.sendStatusCodeError(res, _res);
		}
	}));
}

module.exports = function(req, res, next) {
	var config = this.config;
	var host = (req.headers.host || '').split(':');
	var port = host[1] || 80;
	host = host[0];
	if (net.isIP(host) && util.isLocalAddress(host)) {
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
			if (err || !ports.uiPort) {
				res.response(util.wrapResponse({
					statusCode: err ? 503 : 501,
					headers: {
				    	'content-type': 'text/plain; charset=utf-8'
				    },
					body: err || 'Not implemented'
				}));
				return;
			}
			request(req, res, ports.uiPort);
		});
	} else {
		next();
	}
};
