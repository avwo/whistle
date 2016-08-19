var Transform = require('pipestream').Transform;
var util = require('util');
var iconv = require('iconv-lite');

function BufferTransform(data) {
	if (!(this instanceof BufferTransform)) {
		  return new BufferTransform(data);
	  }
	
	Transform.call(this);
	if (data.body) {
		var body = [];
		data.top && body.push(data.top);
		body.push(body);
		data.bottom && body.push(data.bottom);
		data.body = Buffer.concat(body);
	} else {
		this._top = data.top;
		this._bottom = data.bottom;
	}
}

util.inherits(BufferTransform, Transform);

BufferTransform.prototype._transform = function(chunk, encoding, callback) {
	if (this._ended || this._body) {
		callback(null, this._body);
		this._body = null;
		this._ended = true;
	} else if (this._top) {
		callback(null, chunk ? Buffer.concat([chunk, this._top]) : this._top);
		this._top = null;
	} else if (chunk == null && this._bottom) {
		callback(null, this._bottom);
		this._bottom = null;
	}
};

module.exports = BufferTransform;