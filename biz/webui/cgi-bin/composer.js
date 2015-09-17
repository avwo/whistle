var http = require('http');
var url = require('url');
var config = require('../lib/config');
var util = require('../lib/util');

function parseHeaders(headers) {
	if (!headers || typeof headers != 'string') {
		return {};
	}
	
	try {
		return util.lowerCaseify(JSON.parse(headers));
	} catch(e) {}
	
	var _headers = {};
	headers.split(/\n|\r\n|\r/g)
		.forEach(function(line) {
			line = line.trim().split(/\s*:\s*/);
			if (line[0] && line[1]) {
				_headers[line[0]] = line[1];
			}
		});
	
	return util.lowerCaseify(_headers);
}

module.exports = function(req, res) {
	var _url = req.body.url;
	
	if (_url && typeof _url == 'string') {
		_url = _url.replace(/#.*$/, '');
		var options = url.parse(util.setProtocol(_url));
		var headers = parseHeaders(req.body.headers);
		if (!headers['user-agent']) {
			headers['user-agent'] = 'whistle/' + config.version;
		}
		
		if (options.protocol == 'https:') {
			headers[config.HTTPS_FIELD] = 1;
			if (options.port == 443) {
				options.port = '';
			}
		} else if (options.port == 80) {
			options.port = '';
		}
		
		headers.host = options.hostname;
		if (options.port) {
			headers.host += ':' + options.port;
		}
		options.protocol = null;
		options.hostname = null;
		options.method = req.body.method;
		options.host = '127.0.0.1';
		options.port = config.port;
		options.headers = headers;
		if (headers['content-length'] != null) {
			req.body.body = new Buffer(req.body.body || '');
			headers['content-length'] = req.body.body.length;
		}
		
		headers[config.CLIENT_IP_HEAD] = util.getClientIp(req);
		
		http.request(options, function(res) {
			res.on('error', util.noop);
			util.drain(res);
		})
		.on('error', util.noop)
		.end(req.body.body);
	}
	
	
	res.json({ec: 0, em: 'success'});
};