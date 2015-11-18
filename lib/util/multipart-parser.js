var util = require('./index');
var CRLF = new Buffer('\r\n');
var MAX_SIZE = 5120;
var NAME_RE = /name="([^"]+)"/i;

function MultipartParser(params) {
	this._params = params;
}

function getName(firstLine) {
	return NAME_RE.test(firstLine) ? RegExp.$1 : null;
}

function getPartBuffer(name, value) {
	
	return new Buffer('Content-Disposition: form-data; name="' + name + '"\r\n\r\n' + value);
}

var proto = MultipartParser.prototype;
proto.tansform = function(chunk, callback) {
	if (this._notMatched) {
		return callback(chunk);
	}
	
	if (this._ended) {
		return callback();
	}
	
	chunk = chunk && this._buffer ? this._buffer.concat(chunk) : (this._buffer || chunk);
	
	if (chunk) {
		var index = util.indexOfBuffer(chunk, CRLF);
		if (index != -1) {
			var name = getName(chunk.slice(0, index) + '');
			var value = name ? this._params[name] : null;
			if (value == null) {
				this._notMatched = true;
			} else {
				this._ended = true;
				chunk = getPartBuffer(name, value);
			}
		} else if (chunk.length > MAX_SIZE) {
			this._notMatched = true;
		} else {
			this._buffer = chunk;
			chunk = null;
		}
	}
	
	callback(chunk);
};


