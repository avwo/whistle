var PassThrough = require('stream').PassThrough;
var net = require('net');
var url = require('url');
var rules = require('../rules');
var TIMEOUT = 36000;
var MAX_BYTES = 1024 * 256;
var CRLF_BUF = new Buffer('\r\n');

function parsePairs(pairs, buffer) {
	for (var i = 0, len = buffer.length; i < len; i++) {
		var pair = getPair(buffer[i]);
		if (pair) {
			var value = pairs[pair.key];
			if (value) {
				if (!Array.isArray(value)) {
					value = [value];
				}
				value.push(pair.value);
			}
			pairs[pair.key] = value || pair.value;
		}
	}
	
	return pairs;
}

function getPair(line) {
	if (!(line = line && line.trim())) {
		return;
	}
	
	var index = line.indexOf(':');
	return index != -1 ? {
		key: line.substring(0, index).trim().toLowerCase(),
		value: line.substring(index + 1).trim()
	} : null;
}

function endIndexOf(buffer, start, end) {
	start = start || 0;
	end = end || buffer.length;
	for (; start < end; start++) {
		if (buffer[start] == CRLF_BUF[0] && buffer[start + 1] == CRLF_BUF[1]
		&& buffer[start + 2] == CRLF_BUF[0] && buffer[start + 3] == CRLF_BUF[1]) {
			return start;
		}
	}
	
	return -1;
}

module.exports = function parseReq(socket, callback, readBuffer, neadModifyHeaders) {
	if (typeof readBuffer == 'boolean') {
		var temp = neadModifyHeaders;
		neadModifyHeaders = readBuffer;
		readBuffer = temp;
	}
	
	var proxySocket, timeoutId, buffer;
	socket.on('error', callback);
	if (socket.readable) {
		socket.on('data', parseData);
	}
	readBuffer && parseData(readBuffer);
	
	function parseData(data) {
		clearTimeout(timeoutId);
		buffer = buffer ? Buffer.concat([buffer, data]) : data;
		var endIndex = endIndexOf(buffer);
		if (endIndex == -1) {
			if (buffer.length > MAX_BYTES) {
				callback(new Error('parse error'));
			} else {
				timeoutId = setTimeout(showTimeout, TIMEOUT);
			}
			return;
		}
		
		socket.removeListener('data', parseData);
		var req = neadModifyHeaders ? socket : new PassThrough();
		var headers = {};
		var rawHeaders = buffer.slice(0, endIndex).toString().trim().split(/\r\n/g);
		var firstLine = rawHeaders.shift();
		var status = firstLine.split(/\s/g);
		parsePairs(headers, rawHeaders, 1);
		
		req.method = status[0] || 'GET';
		req.url = status[1] || '/';
		req.httpVersion = status[2] && status[2].split('/')[1] || '1.1';
		req.headers = headers;
		
		if (neadModifyHeaders) {
			req.getBuffer = function(headers) {
				if (!headers) {
					return buffer;
				}
				var rawData = [firstLine];
				Object.keys(headers).forEach(function(key) {
					var value = headers[key];
					value && rawData.push(key + ':' +  value);
				});
				
				return Buffer.concat([rawData.join('\r\n'), buffer.slice(endIndex)]);
			};
		} else {
			req.on('error', function () {
				socket.destroy();
			});
			req.destroy = function() {
				socket.destroy();
			};
			req.socket = socket;
			req.write(buffer);
			socket.pipe(req);
		}
		
		callback(null, req);
	}
	
	function showTimeout() {
		callback(new Error('timeout'));
	}
};