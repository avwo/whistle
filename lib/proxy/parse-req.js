var PassThrough = require('stream').PassThrough;
var net = require('net');
var url = require('url');
var rules = require('../rules');
var util = require('../../util');
var proxyUtil = require('./util');
var MAX_BYTES = 1024 * 256;

module.exports = function parseHeaders(socket, config, callback) {
	var proxySocket, buffer, timeoutId, req;
	
	socket.on('error', callback).on('data', parseData);
	
	function parseData(data) {
		clearTimeout(timeoutId);
		buffer = buffer ? Buffer.concat([buffer, data]) : data;
		var endIndex = proxyUtil.endIndexOf(buffer);
		if (endIndex == -1) {
			if (buffer.length > MAX_BYTES) {
				emitError(new Error('parse error'));
			} else {
				timeoutId = setTimeout(emitError, config.timeout);
			}
			return;
		}
		
		socket.removeListener('data', parseData);
		var headers = {};
		proxyUtil.parsePairs(headers,  buffer.slice(0, endIndex).toString().trim().split(/\r\n/g), 1);
		var options = headers[config.httpsProxyHost];
		options = options && url.parse('http://' + options);
		if (!options || !net.isIP(options.hostname)) {
			return emitError(new Error('unsupport the request'));
		}
		
		req = new PassThrough();
		req.headers = headers;
		req.write(buffer);
		socket.pipe(req);
		options.host = options.hostname;
		req.options = options;
		callback(null, req);
	}
	
	function emitError(err) {
		socket.destroy();
		err = err || new Error('timeout');
		util.emitError(req, err);
		callback(err);
	}
};