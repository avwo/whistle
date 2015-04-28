var IncomingMessage = require('http').IncomingMessage;
var inherits = require('util').inherits;
var CRLF = '\r\n';
var CRLF_BUF = new Buffer(CRLF);
var MAX_BYTES = 1024 * 128;
var TIMEOUT = 36000;

function HttpIncomingMessage(socket) {
	if (!(this instanceof HttpIncomingMessage)) {
		return new HttpIncomingMessage(socket);
	}
	
	var self = this;
	var index = 0;
	var buffer, parsedHeaders, overflow, timeoutId;
	
	IncomingMessage.call(this, socket);
	socket.on('data', parseData);
	socket.on('error', emitError);
	socket.on('free', cleanup);
	
	function cleanup() {
		clearTimeout(timeoutId);
		socket.removeListener('error', emitError);
		socket.removeListener('data', parseData);
		socket.removeListener('free', cleanup);
	}
	
	function parseData(data) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(destroy, TIMEOUT);
		buffer = buffer ? Buffer.concat([buffer, data]) : data;
		if (parsedHeaders) {
			self._parseBody(buffer);
			return;
		}
		
		var endIndex = endIndexOf(buffer, index);
		if (endIndex == -1) {
			endIndex = lastIndexOfCRLF(buffer, index);
			if (endIndex != -1) {
				index = endIndex + 2;
				if (!overflow && buffer.length > MAX_BYTES) {
					overflow = true;
					self._parseHeaders(buffer.slice(0, endIndex));
					buffer = buffer.slice(endIndex);
				}
			}
			return;
		}
		
		endIndex += 4;
		self._parseHeaders(buffer.slice(0, endIndex));
		var statusCode = self.statusCode;
		self._parseBody(buffer.slice(endIndex));
		buffer = null;
		parsedHeaders = true;
		self.emit('response', self);
		if (statusCode == 204 || statusCode == 304 ||
			      (100 <= statusCode && statusCode <= 199)) {
			    self._emitEnd();
		}
	}
	
	function emitError(err) {
		cleanup();
		self.emit('error', err);
		destroy();
	}
	
	function destroy() {
		socket.destroy();
	}
}

inherits(HttpIncomingMessage, IncomingMessage);

var proto = HttpIncomingMessage.prototype;

proto._parseBody = function(buffer) {
	if (this.contentLength_ == null && this.chunkedEncoding_ == null) {
		this.contentLength_ = this.headers['content-length'];
		this.chunkedEncoding_ = this.contentLength_ == null;
	}
	
	if (this.chunkedEncoding_) {
		this._parseChunkedBody(buffer);
		return;
	}
	
	this.contentLength_ -= buffer.length;
	this.push(buffer);
	if (this.contentLength_ <= 0) {
		this._emitEnd();
	}
};

proto._emitEnd = function() {
	this.socket.emit('free');
	this.push(null);
};

proto._parseChunkedBody = function(buffer) {
	buffer = this.buffer_ = this.buffer_ ? Buffer.concat([this.buffer_, buffer]) : buffer;
	if (this.contentLength_ == -1) {
		this._parseTrailers();
		return;
	}
	if (this.contentLength_ > 0) {
		this.parseChunkedBody_();
		return;
	}
	
	var index = indexOfCRLF(buffer);
	if (index == -1) {
		return;
	}
	
	var size = parseInt(buffer.slice(0, index).toString(), 16);
	if (!size) {
		if (isNaN(size)) {
			this.socket.emit('error', new Error('Parse error'))
		} else {
			this.contentLength_ = -1;
			this.buffer_ = buffer.slice(index);
			this._parseTrailers();
		}
		return;
	}
	
	this.contentLength_ = size + 2;
	this.buffer_ = buffer.slice(2);
	this.parseChunkedBody_();
};

proto.parseChunkedBody_ = function() {
	var buffer = this.buffer_;
	var len = buffer.length;
	if (this.contentLength_ <= len) {
		this.buffer_ = buffer.slice(this.contentLength_);
		this.push(buffer.slice(0, this.contentLength_ - 2));
		this.contentLength_ = 0;
	} else {
		len--;
		this.push(buffer.slice(0, len));
		this.buffer_ = buffer.slice(len);
		this.contentLength_ -= len;
	}
};

proto._parseTrailers = function() {
	var index = endIndexOf(this.buffer_);
	if (index != -1) {
		parsePairs(this.trailers, this.buffer_.slice(0, index).toString()
				.trim().split(/\r\n/g));
		this._emitEnd();
	}
};

proto._parseHeaders = function(buffer) {
	buffer = buffer.toString().trim().split(/\r\n/g);
	var firstLine = getPair(buffer[0]);
	if (firstLine) {
		this.httpVersion = firstLine.key.split('/')[1];
		this.statusCode = parseInt(firstLine.value.split(/\s+/g)[0], 10) || 0;
	}
	parsePairs(this.headers, buffer, 1);
	return this;
};

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

function indexOfCRLF(buffer, start, end) {
	start = start || 0;
	end = end || buffer.length;
	for (; start < end; start++) {
		if (buffer[start] == CRLF_BUF[0] && buffer[start + 1] == CRLF_BUF[1]) {
			return start;
		}
	}
	
	return -1;
}

function lastIndexOfCRLF(buffer, start, end) {
	start = start || 0;
	end = end || buffer.length;
	for (--end; end >= start; end--) {
		if (buffer[end - 1] == CRLF_BUF[0] && buffer[end] == CRLF_BUF[1]) {
			return end - 1;
		}
	}
	
	return -1;
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

function parsePairs(pairs, buffer, start) {
	for (var i = start || 0, len = buffer.length; i < len; i++) {
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


module.exports = HttpIncomingMessage;