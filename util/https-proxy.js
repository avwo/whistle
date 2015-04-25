var http = require('http');
var agent = new (http.Agent)({maxSockets: 8});
var IncomingMessage = http.IncomingMessage;
var tls = require('tls');
var CRLF = '\r\n';
var CRLF_BUF = new Buffer(CRLF);
var MAX_BYTES = 1024 * 128;

function isCRLF(buffer, start) {
	   return buffer[start] ==  CRLF_BUF[0] && buffer[start + 1] == CRLF_BUF[1];
}

function getStringHeaders(req) {
	var headers = [req.method + ' ' + req.url + ' HTTP/' + req.httpVersion];
	if (req.headers && !req.headers.Host) {
		req.headers.Host = req.headers.host;
	}
	for (var key in req.headers) {
		var line = req.headers[key];
		if (Array.isArray(line)) {
			line.forEach(function(value) {
				headers.push(key + ': ' + value);
			});
		} else {
			headers.push(key + ': ' + line);
		}
	}
	headers.push(CRLF);
	
	return headers.join(CRLF);
}

function resolveResponse(proxyReq, callback) {
	var proxyRes = new IncomingMessage(proxyReq);
	var index = 0;
	var buffer, ended, done, over;
	
	function execCallback(err) {
		if (!done) {
			callback(err, proxyRes);
			done = true;
		}
	}
	
	function setHeaders(proxyRes, buffer) {
		var headers = {};
		buffer = buffer.toString().split(/\r\n/g);
		var firstLine = getEntry(buffer[0]);
		if (firstLine) {
			proxyRes.httpVersion = firstLine.key.split('/')[1];
			proxyRes.statusCode = firstLine.value.split(' ')[0];
		}
		
		for (var i = 1, len = buffer.length; i < len; i++) {
			var entry = getEntry(buffer[i]);
			if (entry) {
				var value = headers[entry.key];
				if (value) {
					if (!Array.isArray(value)) {
						value = [value];
					}
					value.push(entry.value);
				}
				headers[entry.key] = value || entry.value;
			}
		}
		proxyRes.headers = headers;
		return proxyRes;
	}
	
	function getEntry(line) {
		if (!(line = line && line.trim())) {
			return;
		}
		
		var index = line.indexOf(':');
		return index != -1 ? {
			key: line.substring(0, index).trim().toLowerCase(),
			value: line.substring(index + 1).trim()
		} : null;
	}
   
   proxyReq.on('data', function(data) {
	   if (ended) {
		   proxyRes.push(data);
		   return;
	   }
	   
	   buffer = buffer ? Buffer.concat([buffer, data]) : data;
	   while(buffer[index]) {
		   if (isCRLF(buffer, index)) {
			   ended = isCRLF(buffer, index + 2);
			   if (!over) {
				   over = buffer.length >= MAX_BYTES;
				   if (ended) {
					   index += 4;
					   setHeaders(proxyRes, buffer.slice(0, index));
					   execCallback();
					   buffer = buffer.slice(index);
					   index = 0;
				   }
			   } else if (ended) {
				   proxyRes.push(buffer.slice(index + 4));
			   }
		   }
		   index++;
	   }
	   
	   
   });
   
   proxyReq.on('end', function() {
	   !done && execCallback(new Error('Bad response'));
	   proxyRes.push(null);
   });
}

module.exports = function proxy(req, callback) {
	var headers = req.headers;
	var options = req.options;
	var done;
	
	function execCallback(err, proxyRes) {
		if (!done) {
			callback && callback(err, proxyRes);
			done = true;
		}
	}
	
	options.method = 'CONNECT';
	options.path = headers.host;
	if (options.agent == null) {
		options.agent = agent;
	}
	options.headers = {
			host : headers.host,
			'proxy-connection': 'keep-alive',
			'user-agent': headers['user-agent']
		};
	
	http.request(options).on('error', execCallback)
	.on('connect', function (res, socket, head) {
		socket.on('error', execCallback);
	    var proxyReq = tls.connect({
	        rejectUnauthorized: false,
	        socket: socket
	    }, function () {
	        proxyReq.write(getStringHeaders(req));
	        req.on('data', function(data) {
	        	proxyReq.write(data);
	        });
	        req.on('end', function() {
	        	proxyReq.end();
	        });
	    }).on('error', execCallback);
	    
	 resolveResponse(proxyReq, execCallback);
	}).end();
};


